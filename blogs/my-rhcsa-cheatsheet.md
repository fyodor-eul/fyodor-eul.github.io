title: My RHCSA Cheatsheet
image: images/my_rhcsa_cheatsheet/preview.jpg
description: A collection of useful command to remember for RHCSA examination

# Basics
```bash
cat -n
grep -n
grep -c
```

# File Archiving
```bash
tar -cvf file.tar /path/to/file_or_dir
tar -xvf /path/to/file.tar
tar -xvf /path/to/file.tar -C /path/to/dir

gzip /path/to/file
gunzip /path/to/file.gz
gzip /path/to/file.tar

tar -zcf file1.tgz file1
```


# User Management 
Managing users
```bash
sudo useradd -m -d /home/fyodor -s /usr/bin/bash -g fyodor -G wheel -c "Fyodor Eul" fyodor

sudo usermod -aG vboxusers fyodor      # Adding a group

sudo usermod -s /bin/zsh fyodor        # Changing default shell
sudo usermod -s /sbin/nologin fyodor   # Disabling shell login

sudo usermod -g ropper fyodor

sudo usermod -m -d /home/ropper fyodor # Changing home directory

sudo usermod -l ropper fyodor          # Changing username
sudo groupmod -n ropper fyodor         # Changing groupname

sudo usermod -c "Ropper" ropper        # Changing description

usermod -u 3000 user1                  # Changing user id
usermod -g 3000 user1                  # Changing group id
usermod -g ropper fyodor               # Switching the group (Not renaming the group)
groupmod -n ropper fyodor              # Renaming the group (Not switching the group)

usermod -L user1                       # Lock a user
usermod -U user1                       # Unlock a user
```

Managing groups
```bash
sudo groupadd ropper
sudo usermod -g ropper fyodor

sudo groupmod -n ropper fyodor # Renaming the group (Not changing the group)

groupmod -g 3000 groupa        # Changing group id
```

Removing
```bash
sudo userdel ropper                 # Deleting a user (manually)
sudo rm -rf /home/ropper            #
sudo rm -rf /var/spool/mail/ropper  #

sudo userdel -r ropper              # Deleting a user (recursively)
sudo groupdel ropper                # Deleting a group

gpasswd -d user3 service_gp         # Kicking a user from a group `gpasswd -d boss wheel`
getent group service_gp             # Looking up a group (like a pro)
```

User Permissions
```bash
vim /etc/sudoers.d/users  # users can be any file name
# /etc/sudoers.d/users 
fyodor ALL=(ALL) ALL
###

type dnf
# /etc/sudoers.d/users
boss ALL=(ALL) PASSWD:/usr/bin/dnf
###

chage -l boss            # View chage info for user `boss`
chage -M 90 boss         # Maximum number of days the password is valid
chage -m 1 boss          # Minimum number of days between password changes
chage -E 2026-12-28 boss # Account Expire
chage -W 15 boss         # Warning days before password expire

# Viewing User Management Logs
tail -5 /var/log/audit/audit.log
date #1761228105
```

Access Control List (ACL)
```bash
# Viewing Access Control List
getfacl /share

# Setting Access Control List on Files
setfacl -m u:lisa:rwx /share           # 
setfacl -m g:blackpink:rwx /share

setfacl -m m:--- /share
setfacl -m m:rwsx /share

# ------------------------------------

# Viewing Access Control List
getfacl /share/test.txt
getfacl /share

# Setting Access Control List
setfacl -m u:fyodor:rw- /share/test.txt
setfacl -m g:devs:rw- /share/test.txt
setfacl -x u:fyodor /share/test.txt
setfacl -x g:devs /share/test.txt 

setfacl -m u:fyodor:rwx /share       # Only applies to the specified directory (not including sub directories)
setfacl -Rm u:fyodor:rwX /share      # Including subdirectories (X means gives execute permission only to the sub directories without files)
setfacl -Rm g:devs:rwX /share
setfacl -Rx u:fyodor:rwX /share      # Remove an ACL entry on a directory

# Default Access Control List (on Directories)
setfacl -Rm d:u:fyodor:rwX /share    # Setting default ACL on a directory

# Resetting Access Control List
setfacl -b /opt/test.txt             # Reset ACL definitions on a file 
setfacl -Rb /share                   # Reset ACL definitions on a directory

# Masks (Maximum Effective Permission)

```


# Managing Block Devices
```bash
lsblk
lsblk -f
blkid

fdisk -l

# Resizing File System


# Logical Volume Manager 
pvcreate /dev/sdb1
pvcreate /dev/sdc1
pvs
pvdisplay

vgcreate myvg /dev/{sdb1,sdc1}
vgcreate myvg /dev/sdb1 /dev/sdc1 
vgs
vgdisplay myvg

lvcreate -n IT -L 2G myvg 
lvcreate -n HR -L 5G myvg
lvs 

mkfs.xfs /dev/myvg/IT
mkfs.ext4 /dev/myvg/HR

## Extending & reducing a Logical Volume

vgcreate /dev/sdd1
vgextend myvg /dev/sdd1

lvextend -L +1G /dev/myvg/IT
lvextend -L +100%FREE /dev/myvg/HR

lvextend -L +5G /dev/myvg/IT   # without resizing filesystem
resize2fs /dev/myvg/IT         # resizing filesystem

lvreduce -L -1G /dev/myvg/HR   # reducing logical volume size

## Renaming
lvrename /dev/myvg/HR /dev/myvg/newlv

##
pvcreate /dev/sdd1
vgextend myvg /dev/sdd1

## Removing Logical Volumes
lvremove /dev/myvg/devs
lvremove /dev/myvg/mgmt

## Removing Volume groups
vgremove myvg

## Remove Physical Volumes
pvremove /dev/sdb1
pvremove /dev/sdb2
pvremove /dev/sdc1

```




# Process Management

```bash
ps -e
ps -e | grep firefox
```

```bash
kill -l
kill -9 1234
killall -9 firefox 
```

```bash
who               # view who is using your system
```

```bash
pkill -9 -u boss  # kick user session
pkill -9 -t pts/1 
```

# Linux Networking

Managing Network Manager Connections
```bash
nmcli con show
nmcli con add
nmcli con del
nmcli con down
nmcli con up
nmcli con modify

nmcli con show
nmcli deice show enp0s3

nmcli con add help

# Add dynamic connection
nmcli con add con-name "mydhcp" type ethernet ifname enp0s3 ipv4.method auto ipv4.dns "8.8.8.8,8.8.4.4" autoconnect yes # auto means dhcp
nmcli con down enp0s3
nmcli con del enp0s3

# Add static connection
nmcli con add con-name "static" type ethernet ifname enp0s3 ipv4.method manual ipv4.address 172.20.10.8/28 ipv4.gateway 172.20.10.1 ipv4.dns "8.8.8.8,8.8.4.4" autoconnect yes
```


```
```bash
# Manually Assigning IPv4 Addresses
nmcli connection modify enp0s3 ipv4.addresses 192.168.100.8/24
nmcli connection modify enp0s3 ipv4.gateway 192.168.100.1
nmcli connection modify enp0s3 ipv4.method manual
nmcli connection modify enp0s3 ipv4.dns 8.8.8.8
nmcli connection down enp0s3
nmcli connection up enp0s3
ip addr show enp0s3

# Manually Assigning Secondary IPv4 Addesses to the Same Interface
nmcli device status
nmcli connection show -active
nmcli connection modify enp0s3 +ipv4.addresses 10.0.0.211/24
nmcli connection reload

# Configuration Files
/etc/sysconfig/network-scripts
/etc/hosts
/etc/hostname
/etc/resolv.conf
/etc/nsswitch.conf

# Other Utilities
nmtui
nm-connection-editor
ping
ifconfig
ipup or ifdown
netstat
traceroute
tcpdump
nslookup
dig
ethtool
```

Wireless Connections
```bash
nmcli radio wifi
nmcli radio wifi off
nmcli device wifi list
nmcli device wifi connect Free_Wifi password test123456
nmcli device wifi show password # print qr code for wifi
```

## Firewall
- `firewalld`  <= more important
- `ufw`

```bash
cat /usr/lib/firewalld/services/ssh.xmt
cat /usr/lib/firewalld/services/ftp.xmt
grep "ssh" /etc/services
```

```bash
firewall-cmd --get-zones

firewall-cmd --add-service=ftp    # temporary
firewall-cmd --add-port=21/tcp    # temporary

firewall-cmd --list-services
firewall-cmd --list-ports

# Add services
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
fireall-cmd --list-services

# Add ports
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload
firewall-cmd --list-ports

# Remove services and ports
firewall-cmd --permanent --remove-service=http
firewall-cmd --permanent --remove-port=80/tcp
fireall-cmd --reload
```

## Secure Shell (SSH)
```bash
# man pages
sshd(8)
sshd_config(5)

# Config Files
/etc/ssh/sshd_config

# Setting Timeout Interval
# /etc/ssh/sshd_config
ClientAliveInterval 120 # 120 seconds 2 minutes
ClientAliveCountMax 5   # send "keep alive msg" 5 times
# 120 * 5 = 600 seconds = 10 minutes
systemctl restart sshd

# Disabling Root Login
# /etc/ssh/sshd_config
PermitRootLogin no # Disabling root login
PermitEmptyPasswords no # Disabling login with empty password
systemctl restart sshd

# Setting Allowed Users
# /etc/ssh/sshd_config
AllowUsers user1 user2
systemctl restart sshd

# SSH Keys
ssh-keygen -t ed25519 -C "your_email@example.com"
ssh-copy-id user@example.com
ssh-copy-id -i /root/.ssh/id_rsa.pub root@example.com

# File Permissions for SSH Keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519
```

## SSH Port Forwarding
```bash
vim /etc/ssh/sshd_config

Port 2222
```

```bash
# Adjusting Firewall
firewall-cmd --list-port
firewall-cmd --add-port=2222/tcp # temporary
or
firewall-cmd --add-port=2222/tcp --permanent
firewall-cmd --reload

# Adjusting SELinux
# `setenforce 0` will do but not recommended
semanage port -l | grep "ssh"
semanage port -a -t ssh_port_t -p tcp 2222
# semanage port -d -t ssh_port_t -p tcp 2222 # to delete 2222 back.

systemctl restart sshd
```

## Systemd

```bash
```


## `cron` jobs

```bash
dnf provides crontab

systemctl status crond

crontab -l

timedatectl
```

```
┌───────────── minute (0–59)
│ ┌───────────── hour (0–23)
│ │ ┌───────────── day of month (1–31)
│ │ │ ┌───────────── month (1–12)
│ │ │ │ ┌───────────── day of week (0–7, Sun=0 or 7)
│ │ │ │ │
* * * * * command-to-run
```

```bash
# mins(0-59) hr(0-24) day_of_month month_of_year(1-12) day_of_week(0-6)[0-Sun, 1-Mon, 6-Sat] 
* * * * * mkdir /root/Hello
40 20 28 12 * mkdir /root/Hi
@reboot 
@hourly
@daily
@weekly
@montly
@yearly
```

```bash
crontab -e
systemctl restart crond
crontab -l
```

## Network Time Protocol (NTP)

### Setting Up NTP Client

```
Google: ntp pool for myanmar
0.asia.pool.ntp.org
```

```
systemctl status chronyd
systemctl start chronyd
systemctl enable chronyd 
```

```bash
# /etc/chrony.conf
server 0.asia.pool.ntp.org iburst # add this line

systemctl restart chronyd
```


# SELinux

Modes
- Enforcing
- Permissive
- Disable

```bash
getenforce

setenforce 0 # switch to Permissive mode (temporary)
setenforce 1 # switch to Enforcing mode (temporary)

```

Enforcing 
- Labeling
- Policy

Permissive
- Labeling

```
semanage
seinfo
```

```bash
vim /etc/selinux/config
```



# File Server (Samba)
## Samba Setup

### Setting Static IP
```bash
nmcli con add con-name "static" type ethernet ifname enp0s3 ipv4.method manual ipv4.address 172.20.10.8/28 ipv4.gateway 172.20.10.1 ipv4.dns "8.8.8.8,8.8.4.4" autoconnect yes
```

### Install Samba Package
```bash
dnf install samba samba-client samba-common cifs-utils
```

### Setup the service
```bash
systemctl <status|start|enable> smb
```

### Allow Firewall
```bash
firewall-cmd --permanent --add-service=samba
firewall-cmd --reload
```

### Create Local Group and Local User ( Add the User to the Local Group)
```bash
groupadd smbgp
useradd -G smbgp smbuser
getent group smbgp
```

### Create Share Directory and Set the Right Permission
```bash
mkdir /srv/smb
ls -ld /srv/smb
chown -R root:smbgp /srv/smb
chmod -R 770 /srv/smb
```

### Add and Enable SMB User
```bash
smbpasswd -a smbuser # add
smbpasswd -e smbuser # enable
```

### Config
```bash
vim /etc/samba/smb.conf

[smbshare]
	valid user = @smbgp
	path = /srv/smb
	writable = yes
	browseable = yes
	guest ok = no
```


### Restart SMB Service
```bash
systemctl restart smb
```

## Connect From the Client
```bash
ping [SERVER IP]
```

In File Manager > Others
```yaml
smb://[SERVER IP]/smbshare
```

If the client cannot create any file it is probably because of SELinux

On the server
```bash
ls -Zd /srv/smb # view SELinux File Permissions
seinfo -t | grep "samba"
# change `var_t` to `samba_share_t`
chcon -t samba_share_t /srv/smb
# restorecon -r /srv/smb # to restore back to `var_t`
```

# Samba Client Setup

```bash
dnf install samba samba-client samba-common cifs-utils -y
```

Creating mount point
```bash
mkdir /mnt/smb

# temporary mount
mount -t cifs -o user=smbuser //192.168.31.245/smbshare /mnt/smb

#verify
df -Th
```

permanent mount
```bash
vim /smbpasswd

username=smbuser
password=smbuser
```

```bash
vim /etc/fstab

# For SMB for `root` user
//192.168.31.245/smbshare /mnt/smb cifs uid=0,credentials=/smbpasswd,noperm 0 0

mount -a
```

to track Samba Client Access from servers
```bash
smbstatus
```


# FTP (RHCSA မှာမပါဘူး)

```bash
dnf install vsftpd -y
```

```bash
systemctl status vsftpd
systemctl start vsftpd
systemctl enable vsftpd
```

```bash
firewall-cmd --permanent --add-service=ftp
firewall-cmd --permanent --add-port=20-21/tcp

firewall-cmd --reload
```

Create a local user
```bash
useradd testuser
passwd testuser
```

Add the user to the `user_list` file.
```bash
echo "testuser" >> /etc/vsftpd/user_list
```

create a share directory
```bash
mkdir /srv/ftp
```

Change ownership and permission
```bash
chown -R testuser:testuser /srv/ftp
chmod -R 770 /srv/ftp

ls -ld /srv/ftp
```

Backup and edit `vsftpd.conf` file
```bash
cp /etc/vsftpd/vsftpd.conf /etc/vsftpd/vsftpd.conf.bak
vim /etc/vsftpd/vsftpd.conf

# line no.100
chroot_local_user=YES
allow_writable_chroot=YES
...
userlist_enable=YES
local_root=/srv/ftp
userlist_file=/etc/vsftpd/user_list
userlist_deny=NO
```

```bash
systemctl restart vsftpd
systemctl status vsftpd
```


# Network File System (NFS)

Install a package
```bash
dnf install nfs-utils -y # need to install on both server and client
```

Creating share directory and setting permissions
```bash
mkdir /srv/nfs
chown nobody:nobody /srv/nfs
```

```bash
vim /etc/exports

/srv/nfs      192.168.31.57(rw,sync)
# /srv/nfs      192.168.31.0/24(rw,sync)
# /srv/nfs      *(rw,sync)
```

```bash
systemctl restart nfs-server
systemctl enable nfs-server
systemctl status nfs-server
```

```bash
firewall-cmd --permanent --add-service={rpc-bind,mountd,nfs}
# firewall-cmd --permanent --add-service=rpc-bind
# firewall-cmd --permanent --add-service=mountd
# firewall-cmd --permanent --add-service=nfs
firewall-cmd --reload
```

### Client Setup
Install package
```bash
dnf install nfs-utils -y # need to install on both server and client
```

```bash
showmount -e 192.168.31.96
```

create mount point
```bash
mkdir /mnt/mynfs
mount 192.168.31.96:/srv/nfs /mnt/mynfs/  # temporary mount
df -Th                                    # verify
```

permanent mount
```bash
vim /etc/fstab

#nfs
192.168.31.96:/srv/nfs /mnt/mynfs nfs4 defaults 0 0
mount -a
```

homework

dhcp connection "mydhcp" 
static connection "mystatic"
samba setup
nfs setup
