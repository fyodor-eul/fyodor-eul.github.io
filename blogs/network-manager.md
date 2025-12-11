title: The Basics of `NetworkManager`
image: images/my_rhcsa_cheatsheet/preview.jpg
description: Understanding the basic usage of NetworkManager

# NetworkManager services

# The Basics Usage of `nmtui`

# The Basics Usage of `nmcli`

```bash
nmcli connection show
```

You can type in short form as the following

```bash
nmcli con show
```
![img]()

# Adding a New Connection with Dynamic IP Address (DHCP)

You can view the interface name by either of the following two commands
```bash
ifconfig
ip a
```
![img]()

Viewing the connection type
```bash
nmcli con add help
```

Under `TYPE_SPECIFIC_OPTIONS`, you may see something as the following
![image1]()
I'll chose `ethernet` in our example.

Adding a Dynamic(DHCP) Connection
In DHCP connection, clients(our pcs) make request to the DHCP server to request for an IP address.
```bash
nmcli con add con-name "my_dhcp_con" type ethernet iface enp0s3 ipv4.method auto ipv4.dns "8.8.8.8,8.8.4.4" autoconnect yes
```

When you list the connections now, you will see as the followings
![imgage]()

To remove the connection back you can do this as follows by specifying the name of the connection to delete
```bash
nmcli con del my_dhcp_con
```

Adding a Static Connection
```bash
```






You can also modify connections 

```bash
nmcli con mod "my_dynamic" con-name "my_dhcp"
```







# Key Takeaways

```bash
nmcli con show 
```

```bash
nmcli con add con-name "my_dynamic" ipv4.method auto ipv4.dns "8.8.8.8, 8.8.4.4" autoconnect yes
```

```bash
nmcli con add con-name "my_static" ipv4.method 
```



