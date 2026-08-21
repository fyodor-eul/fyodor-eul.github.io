title: Self-Hosted Modded Minecraft Server (Neoforge 26.2)
image: images/projects/mc-server/cover.png
description: Self-hosted modded Minecraft server (NeoForge 26.2) built from scratch on a Linux VPS including systemd-managed service with auto-restart and boot-start, nginx-hosted resource pack, curated mod set, and automated world backups.

**Stack**: **Alma Linux**, **NeoForge 26.2**, **Java 25**, `systemd , `firewalld`, **Nginx**

# 1. Overview

The goal was a private, always-on modded Minecraft server for a small group, self-hosted on a Linux VPS rather than a managed game host, to keep full control of the OS and to treat it as a real systems-administration exercise.

Requirements:

- Multiplayer server reachable over the internet, surviving reboots and crashes
- A curated set of mods, matched across server and clients.
- Automatic delivery of custom textures to players (no manual client-side texture install).
- Run under a dedicated, unprivileged user with the service sandboxed.

Result: a running NeoForge 26.2 server hosting an imported world and a server-pushed resource pack and mods, and a `systemd` unit that auto-restarts and starts on boot.

# 2. Architecture

```markdown
                    +----------------------------------------------+
                    │              Linux VPS (AlmaLinux)           │
                    │                                              │
   Players  ─────►  │  firewalld : 25565/tcp  ──►  NeoForge 26.2   │
   (NeoForge        │                              server (java)   │
    clients)        │                              │   run as      │
                    │                              │   mc-admin    │
                    │                              │   under       │
                    │                              │   systemd     │
                    │                                              │
                    │  world/                                      |
                    │    +---datapacks/spellcraft-datapack.zip     │
                    │    +--- (imported world data)                │
                    │  mods/  (server-side mods)                   │
                    │                                              │
   Players  ─────►  │  firewalld : 80/tcp  -->  nginx  -->         │
   (resource pack   │                           /usr/share/nginx/  │
    auto-download)  │                           html/              │
                    │                           RESOURCE_PACK.zip  │9
                    +----------------------------------------------+
```

**Two network paths:**

- **25565** : the Minecraft protocol. Clients connect here; NeoForge negotiates the mod
set with each client on join.
- **80** : nginx serves the resource pack zip. The server hands clients the URL via
`server.properties`, and the vanilla client auto-downloads it on connect.

# 3. Implementation

## 3.1 Firewall

Make sure firewalld is installed

```bash
dnf install -y firewalld
```

Enable firewalld service and check the state. (It should be running)

```bash
systemctl status firewalld 
systemctl enable --now firewalld
firewall-cmd --state
```

Add a permanent rule to allow ports on the firewalld service.

```bash
firewall-cmd --permanent --add-port=25565/tcp
firewall-cmd --permanent --add-port=25565/udp
firewlal-cmd --reload
```

## 3.2 Dedicated User

Now, I recommend to create a separate user to manage the service itself rather than running on the `root` user.

```bash
sudo useradd -m -d /opt/mc-admin -s /bin/bash mc-admin  # Create the user
sudo passwd mc-admin                                    # Set the password
sudo chown -R mc-admin:mc-admin /opt/mc-admin           # Ensure the ownership
```

## 3.3 Java Installation

FInstall the java package

```bash
sudo dnf install -y java-25-openjdk-headless
```

Configure to make sure the right version

```bash
# make sure we select the correct version 
sudo alternatives --config java 
sudo alternatives --config jre_openjdk # optional 
```

Check the java version with `java -version`.

## 3.4 NeoForge Installation

install NeoForge 26.2 as `mc-admin`.

```bash
su - mc-admin        # switch user

mkdir -p /opt/mc-admin/mcserver
cd /opt/mc-admin/mcserver
wget https://maven.neoforged.net/releases/net/neoforged/neoforge/26.2.0.59/neoforge-26.2.0.59-installer.jar

java -jar neoforge-26.2.0.59-installer.jar --installServer
```

Configuring Neoforge

```bash
echo "eula=true" > eula.txt
```

Configuring RAM `vi user_jvm_args.txt`.

```bash
-Xms4G -Xmx6G
```

Generate the world

```bash
./run.sh
```

For `tlauncher` we need to disable online mode. Edit `server.properties`

```bash
online-mode=false # true for normal minecraft
```

Once it finishes loading, type `stop`.

## 3.5 Run Persistently with a Systemd Service

Create the service file `/etc/systemd/system/minecraft-server.service`with the following contents.

```bash
[Unit]
Description=Minecraft NeoForge Server (26.2)
After=network.target

[Service]
User=mc-admin
WorkingDirectory=/opt/mc-admin/mcserver
ExecStart=/opt/mc-admin/mcserver/run.sh
Restart=on-failure
SuccessExitStatus=0 1

[Install]
WantedBy=multi-user.target
```

Reload systemd and enable the service.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minecraft-server
sudo systemctl status minecraft-server
```

You can monitor the service as follows

```bash
journalctl -u minecraft -f
```

## 3.6 (Optional) Importing an Existing World

1. Stop the server

```bash
sudo systemctl stop minecraft-server
```

1. Get the world folder onto the server

```bash
unzip -l THEIR_ZIP.zip | grep saves/          # see the world's folder name
unzip THEIR_ZIP.zip "saves/WORLD_NAME/*" -d extracted-world/
```

1. Swap it in (back up the old world folder first, then move the custom world)

```bash
cd /opt/mc-admin/mcserver
mv world world_backup_$(date +%s)  # rename the destination folder 
mv "/path/to/extracted-world/saves/WORLD_NAME" world
ls world/                         # verify: level.dat at top level, NO subfolder
```

1. Ensure the ownership

```bash
sudo chown -R mc-admin:mc-admin /opt/mc-admin/mcserver/world
```

## 3.7 Future NeoForge Mods (must be 26.2 builds)

Copy the download mods under `mods/` directory on the server, ensure the ownership to the dedicated user and restart the service.

```bash
sudo cp SomeMod-neoforge-26.2.jar /opt/mcserver/mods/
sudo chown mc-admin:mc-admin /opt/mcserver/mods/SomeMod-neoforge-26.2.jar
sudo systemctl restart minecraft
```

## 3.8 (Optional) Adding a Custom Resource Pack

On the same VPS, you can have a different service hosting your custom resource pack. We will be using the nginx server to host this.

Install `nginx` 

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
```

You can confirm the `nginx` service is up by running `sudo systemctl status nginx`.

Then, copy the resource pack into `/usr/share/nginx/html/`.

```bash
sudo cp /PATH/TO/YOUR_RESOURCE_PACK.zip /usr/share/nginx/html/
```

Generate the SHA1 Hash(We will need to provide this hash to our minecraft server).

```bash
sha1sum /usr/share/nginx/html/spellcraft-resources.zip
```

Open `/opt/mc-admin/mcserver/server.properties` file and set the following

```bash
resource-pack=http://YOUR_IP/YOUR_RESOURCE_PACK.zip
resource-pack-sha1=PASTE_SHA1_HERE
require-resource-pack=true
```

Every time you make any changes to your resource packs. You need to regenerate the SHA1 Hash and update the `server.properties` again.

## 3.9 Automatic Backup of World

For the backup script, create `/opt/mc-admin/backup-world.sh`

```bash
#!/usr/bin/env bash

SERVER_DIR="/opt/mc-admin/mcserver"
BACKUP_DIR="/opt/mc-admin/backups"
KEEP=7                                   # how many backups to retain
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# compress the world folder into a timestamped archive
tar -czf "$BACKUP_DIR/world-$TIMESTAMP.tar.gz" -C "$SERVER_DIR" world

# prune: keep only the newest $KEEP archives, delete the rest
ls -1t "$BACKUP_DIR"/world-*.tar.gz | tail -n +$((KEEP+1)) | xargs -r rm --

echo "Backup complete: world-$TIMESTAMP.tar.gz ($(ls -1 "$BACKUP_DIR"/world-*.tar.gz | wc -l) kept)"
```

Make it executable and owned by the service user:

```bash
sudo chmod +x /opt/mc-admin/backup-world.sh
sudo chown mc-admin:mc-admin /opt/mc-admin/backup-world.sh
```

Create the systemd service file `/etc/systemd/system/mc-backup.service`.

```bash
[Unit]
Description=Minecraft world backup
After=network.target

[Service]
Type=oneshot
User=mc-admin
ExecStart=/opt/mc-admin/backup-world.sh
```

`Type=oneshot` = run once and exit (correct for a backup job, not a long-running daemon).
`User=mc-admin` = run as the service user, so archives are owned correctly.

Create the timer unit `./etc/systemd/system/mc-backup.timer`.

```bash
[Unit]
Description=Run Minecraft world backup daily

[Timer]
OnCalendar=*-*-* 04:00:00
Persistent=true                

[Install]
WantedBy=timers.target
```

`OnCalendar=*-*-* 04:00:00` means every day at 04:00

`Persistent=true` if the box was off at 04:00, run at next boot

Reload and enable

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mc-backup.timer
```

Confirm it is scheduled

```bash
systemctl list-timers mc-backup.timer
```

Restoring from a backup

```bash
# stop the server
sudo systemctl stop minecraft-server

# move the current (broken) world aside — never delete outright
cd /opt/mc-admin/mcserver
mv world world_broken_$(date +%s)

# extract the chosen backup in place
tar -xzf /opt/mc-admin/backups/world-YYYYMMDD-HHMMSS.tar.gz -C /opt/mc-admin/mcserver/

# fix ownership and restart
sudo chown -R mc-admin:mc-admin /opt/mc-admin/mcserver/world
sudo systemctl start minecraft-server
```

# 4. Setup Summary

| Item | Value |
| --- | --- |
| Minecraft Version  | 26.2 |
| Java | 25 |
| Mod Loader | NeoForge |
| Server Directory | /opt/mc-admin/mc-server |
| Server User | mc-admin |
| Nginx Web Root | /usr/share/nginx/html |
| Ports | 25565(game), 80(resource pack) |

# 5. References

- https://youtu.be/0kFjEUDJexI?si=6mVb_Vrisa7nrHBU
- https://docs.neoforged.net/user/docs/server/
- https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_systemd_unit_files_to_customize_and_optimize_your_system/index
