title: Building a KVM Home Server
image: images/projects/KVMHomeServer/system_overview.png
description: A headless home server running a lab of Rocky Linux VMs, managed entirely over SSH. With only a mobile hotspot at home, I gave it internet access by turning my laptop into a NAT router over a direct Ethernet cable.

**Stack:** Rocky Linux, `libvirt` + QEMU + KVM, NetworkManager + `iptables`

## Goal
Set up a headless home server on a used Lenovo ThinkCentre M93p, running a lab of virtual machines on `libvirt`, QEMU and KVM for practicing Linux administration.

## Problem
Practicing Linux administration properly needs several machines that can talk to each other: one to manage, others to be managed, and freedom to break them. My laptop doesn't have the resources to run a multi-VM lab alongside daily work. I needed a dedicated machine that stays on and hosts the whole lab. It's also my first step towards self-hosting: once the server is running reliably, it can host my own services too.

## Challenge
At home, my only internet is a mobile connection shared over a hotspot. There's no router and no Ethernet port to plug a server into.

## Solution
I turned my Arch Linux laptop into a NAT router. The server connects to the laptop over a direct Ethernet cable, and the laptop forwards its traffic out through Wi-Fi.

## The setup
---

| Machine | Hardware / OS | Role |
|---|---|---|
| Laptop | Arch Linux | Wi-Fi uplink, NAT router for the server |
| Server | ThinkCentre M93p, i5-4570, 8 GB RAM, 240 GB SSD, Rocky Linux 10.2 | Headless KVM Host |
| VMs | Rocky 10.2, minimal install | `control`, `node1`, `node2` for Ansible |

## Network Design
---
![network diagram](images/projects/KVMHomeServer/network_diagram.png)

The server's only route to internet is the laptop. Its default gateway is the laptop's cable address, `192.168.64.1`.

### Routing tables
Laptop:
```
default via 172.20.10.1 dev wlan0
172.20.10.0/28 dev wlan0
192.168.64.0/24 dev enp45s0u2c2
```

Server:
```
default via 192.168.64.1 dev eno1
192.168.64.0/24 dev eno1
```

## How a packet reaches the internet
---
Following a ping from the server to `1.1.1.1`:
1. **Server**: `1.1.1.1` isn't on a local subnet, so the server sends it to the default gateway, the laptop.
2. **Laptop receives it on the cable**. The destination isn't on the laptop itself. With IP forwarding enabled, the kernel looks up a route instead of dropping it, and matches the laptop's own default route through `wlan0`.
3. **MASQUERADE** rewrites the server's source IP address from `192.168.64.254` to the laptop's Wi-Fi address, so the hotspot sees normal traffic from the laptop hiding the server's address behind the NAT. Conntrack records the mapping.
4. **The reply** comes back to the laptop. Conntrack restores the original destination, and the laptop's connected route `192.168.64.0/24 dev enp45s0u2c2` sends it down the cable to the server.

The laptop needs no extra routes: its default route handles the way out, and the connected route created by its `/24` address handles the way back.

## Configuration
---
**Laptop** (NetworkManager + iptables):

```bash
# static address on the cable, no gateway
nmcli connection add type ethernet ifname enp45s0u2c2 connection.id HomeLAN \
  ipv4.method manual ipv4.addresses 192.168.64.1/24

# forward packets that aren't addressed to the laptop
sudo sysctl -w net.ipv4.ip_forward=1

# hide the server's subnet behind the laptop's Wi-Fi address
sudo iptables -t nat -A POSTROUTING -s 192.168.64.0/24 -o wlan0 -j MASQUERADE
```


**Server**
```bash
nmcli connection add type ethernet ifname eno1 connection.id HomeLAN \
  ipv4.method manual ipv4.addresses 192.168.64.254/24 \
  ipv4.gateway 192.168.64.1 ipv4.dns 1.1.1.1
```


## Virtual Machine Setup (`qemu` + `libvirt` + `kvm`)
---
On the server, three Rocky Linux VMs run on QEMU/KVM, managed by `libvirt`, on `libvirt`'s default NAT network. One will run Ansible and the other two are the managed nodes it configures.

| VM | IP | RAM | Disk |
|---|---|---|---|
| control | 192.168.122.10 | 1.5GB | 20GB |
| node1 | 192.168.122.11 | 1GB | 20GB |
| node2 | 192.168.122.12 | 1GB | 20GB |

### 1. Enable hardware virtualization
Turned on virtualization support in BIOS, then confirmed it with `virt-host-validate qemu`.

### 2. Install KVM and libvirt

```bash
sudo dnf install -y qemu-kvm libvirt virt-install
sudo systemctl enable --now virtqemud.socket virtnetworkd.socket virtstoraged.socket
```
Rocky Linux 10 runs `libvirt` as modular daemons, one per driver (VMs, networks, storage), instead of the older single `libvirtd`.

### 3. Create each VM 

```bash
sudo virt-install --name control --memory 1536 --vcpus 1 \
  --cpu host-passthrough --disk size=20 \
  --location /var/lib/libvirt/images/iso/Rocky-10.2-x86_64-dvd1.iso \
  --os-variant detect=on,require=off \
  --network network=default --graphics none \
  --extra-args 'console=ttyS0,115200n8 inst.text'
```

### 4. Run the text installer
![Serial Console](images/projects/KVMHomeServer/serial_console.png)

Anaconda's text installer runs inside the SSH session. For each VM, I chose:

- **Software selection**:  Minimal Install, with no add-on groups
- **Installation Destination**: the whole 20GB disk, automatic LVM layout

### 5. Snapshot each VM
Right after installation, I took a snapshot of each VM:
```bash
virsh snapshot-create-as control clean
virsh snapshot-create-as node1 clean
virsh snapshot-create-as node2 clean
```
When a practice session breaks something, `virsh snapshot-revert <vm> clean` restores it in seconds.

### Managing the VMs

| Task | Command |
|---|---|
| List VMs | `virsh list --all` |
| Start / shut down | `virsh start node1` / `virsh shutdown node1` |
| Open the console | `virsh console node1` (exit with `Ctrl + ]`) |
| Revert to a snapshot | `virsh snapshot-revert node1 clean` |
| Delete VM and its disk | `virsh destroy node1 && virsh undefine node1 --remove-all-storage` |

VM traffic is `NAT`ed twice: once by `libvirt` on the server, then by the laptop on its way to the hotspot.

On VM (NAT behind server:`192.168.122.1`)
```bash
default via 192.168.122.1 dev enp1s0
192.168.122.0/24 dev enp1s0
```

On server (NAT behind laptop:`192.168.64.1`)
```bash
[root@localhost ~]# ip route
default via 192.168.64.1 dev eno1
192.168.64.0/24 dev eno1 
192.168.122.0/24 dev virbr0
```

## Next Steps
- Make the laptop's forwarding and NAT rules persist across reboots
- Set up Cockpit for a web view of the server and its VMs.
- Host more services on the server and expose them through the laptop's IP, so other devices on the local network can reach them.