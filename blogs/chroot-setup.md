title: Making Your Own chroot Environment
image: images/chrootSetup/diagram.png
description: A guide to a basic setup of a `chroot` environment
cover: images/chrootSetup/diagram.png

# Introduction
We all know that each of the running processes has its own set of permissions when accessing the filesystem. Even so, they generally share the same filesystem hierarchy.
```bash
/
├── bin/
├── etc/
├── home/
├── usr/
├── var/
├── tmp/
└── ...
```
What if we want a process to see the filesystem root differently?
We can achieve this by setting a certain directory on our system to appear as the root directory of a certain process, and the tool that allows us to do this is called **chroot**.
> [***chroot(1)***](https://man7.org/linux/man-pages/man1/chroot.1.html) is a command-line utility that uses the [***chroot(2)***](https://man7.org/linux/man-pages/man2/chroot.2.html) system call to change the process's root directory.

For example, if we chrooted a process to `/opt/myroot`, `/opt/myroot` on the host will appear as `/` to that process. However, `/opt/myroot` remains `/opt/myroot` for other processes.

```bash
# Host and other processes
/
├── bin/
├── etc/
├── home/
├── usr/
├── opt/
│   └── myroot/
│       ├── bin/
│       └── lib/
└── ...

# Chrooted process
/
├── bin/          <= actually /opt/myroot/bin
└── lib/          <= actually /opt/myroot/lib
```

But, why would we want to do this? What benefits do we get from giving a process a different view of the filesystem?
As mentioned above, every process can potentially access paths throughout the system if the permission allows it. 
But, usually a process only requires a small set of executables (under `/bin`), libraries (under `/lib`) and maybe configuration files (under `/etc`). Besides, imagine the process we want to run needs different versions of dependencies such as executables or libraries. What if these dependencies conflict with the system's existing configurations?
`chroot` has been useful in several situations, including system recovery, building Linux systems such as Linux From Scratch, testing alternate userspaces, and restricting the filesystem view of certain services like FTP. It is also related to how the container runtimes construct their filesystem hierarchies.
Now, let's take a look into how we can create our own simple chroot jail.

# Creating a Simple `chroot` Jail
## Getting Started
In order to run Bash inside our chroot environment, we need to provide Bash and all of the files it depends on. This includes shared libraries and the dynamic loader. Therefore, let us take a look into how these directories are laid out at the root of our current filesystem.
```bash
$ ls -l /
total 68
lrwxrwxrwx   1 root   root       7 Oct 13  2025 bin -> usr/bin
drwxr-xr-x   4 root   root    4096 Sep  3 00:02 boot
drwxr-xr-x  20 root   root    4300 Sep  3 11:43 dev
drwxr-xr-x   4 fyodor fyodor  4096 Apr 21 16:03 drive
drwxr-xr-x 105 root   root   12288 Sep  3 14:35 etc
drwxr-xr-x   5 root   root    4096 May 15 10:04 home
lrwxrwxrwx   1 root   root       7 Oct 13  2025 lib -> usr/lib
lrwxrwxrwx   1 root   root       7 Oct 13  2025 lib64 -> usr/lib
drwx------   2 root   root   16384 Nov  9  2024 lost+found
drwxr-xr-x   7 root   root    4096 Sep  2 22:26 media
drwxr-xr-x   3 root   root    4096 Aug 31 18:30 mnt
drwxr-xr-x  10 root   root    4096 Aug 22 19:01 opt
dr-xr-xr-x 313 root   root       0 Sep  2 13:04 proc
drwxr-x---  18 root   root    4096 Aug 31 22:41 root
drwxr-xr-x  35 root   root    1080 Sep  2 23:34 run
lrwxrwxrwx   1 root   root       7 Oct 13  2025 sbin -> usr/bin
drwxr-xr-x   7 root   root    4096 Aug 31 20:16 srv
dr-xr-xr-x  13 root   root       0 Sep  2 13:04 sys
drwxrwxrwt  17 root   root     640 Sep  3 15:03 tmp
drwxr-xr-x  11 root   root    4096 Sep  3 00:01 usr
drwxr-xr-x  13 root   root    4096 Sep  2 13:04 var
```
In many modern Linux systems using a merged `/usr` layout, directories such as `/bin` and `/lib` are symbolic links into `/usr`. On our system, for example, `/bin` points to `/usr/bin`, while `/lib` and `/lib64` point to `/usr/lib`.
```bash
$ ls /usr/bin
$ ls /usr/lib
```
So, we will do the same setup on our jailed root environment. We can start by creating directories as follows.
```bash
sudo mkdir -p /opt/jailroot           # This directory will be the root of the jailed environment
sudo mkdir -p /opt/jailroot/usr/bin   # We will copy some executables here
sudo mkdir -p /opt/jailroot/usr/lib   # and their dependencies under this directory
sudo mkdir -p /opt/jailroot/usr/lib64 # here we will need to keep our dynamic loader (we will get to that later)
```
## Adding `bash` and Its Libraries
Then, we need to add the `bash` shell into our jailed environment. Let us locate the `bash` executable.
```bash
$ command -v bash      # locate the bash executable
/usr/bin/bash
$ file /usr/bin/bash   # verify if this is the right type of file
/usr/bin/bash: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=ecb3ca1e4e099c80e279256314985dbe33e99a2a, for GNU/Linux 4.4.0, stripped
```
> As we can see here, `bash` is under the `/usr/bin` directory and we can confirm that it is executable file.
Let's copy this file into our environment under `/opt/jailroot/usr/bin` directory.
```bash
$ sudo cp /usr/bin/bash /opt/jailroot/usr/bin/
$ tree /opt/jailroot/
/opt/jailroot/
└── usr
    ├── bin
    │   └── bash
    ├── lib
    └── lib64

5 directories, 1 file
```
However, we still need to add the required libraries for this to work and we can find them using the [***ldd(1)***](https://man7.org/linux/man-pages/man1/ldd.1.html) utility.
```bash
$ ldd /usr/bin/bash
	linux-vdso.so.1 (0x00007f4d00ece000)
	libreadline.so.8 => /usr/lib/libreadline.so.8 (0x00007f4d00d0a000)
	libc.so.6 => /usr/lib/libc.so.6 (0x00007f4d00a00000)
	libncursesw.so.6 => /usr/lib/libncursesw.so.6 (0x00007f4d00c99000)
	/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007f4d00ed0000)
```
> We can see several shared object (`.so`) files here. We can see 3 files under `/usr/lib` and the dynamic loader file under `/usr/lib64`. We are going to copy these files into our jailed root's `usr/lib` and `usr/lib64` directories accordingly.
```bash
$ sudo cp /usr/lib/libreadline.so.8 /opt/jailroot/usr/lib/          # shared libraries
$ sudo cp /usr/lib/libc.so.6 /opt/jailroot/usr/lib/
$ sudo cp /usr/lib/libncursesw.so.6 /opt/jailroot/usr/lib/

$ sudo cp /usr/lib64/ld-linux-x86-64.so.2 /opt/jailroot/usr/lib64/  # dynamic loader
```
Finally, we need to create the `/bin`, `/lib` and `/lib64` paths expected by `bash` and its dependencies. Since our files are stored under `/usr`, we can recreate these paths using symbolic links.
```bash
$ cd /opt/jailroot
$ sudo ln -s usr/bin ./bin
$ sudo ln -s usr/lib ./lib
$ sudo ln -s usr/lib64 ./lib64
```
The structure of `/opt/jailroot/` should look as follows:
```bash
$ tree /opt/jailroot/
/opt/jailroot/
├── bin -> usr/bin
├── lib -> usr/lib
├── lib64 -> usr/lib64
└── usr
    ├── bin
    │   └── bash
    ├── lib
    │   ├── libc.so.6
    │   ├── libncursesw.so.6
    │   └── libreadline.so.8
    └── lib64
        └── ld-linux-x86-64.so.2

7 directories, 5 files
```
Now, we can chroot into `/opt/jailroot`. 
```bash
$ sudo chroot /opt/jailroot /bin/bash
bash-5.3#
bash-5.3# pwd
/
bash-5.3# ls
bash: ls: command not found
bash-5.3# 
bash-5.3# exit
$
```
> ***Important Distinction***: The second argument to the above chroot command is `/bin/bash`, which corresponds to `/opt/jailroot/bin/bash` on the host.
Notice that we still cannot run the `ls` command. This is because `pwd`([***bash(1)***](https://man7.org/linux/man-pages/man1/bash.1.html)) is the **Bash built-in**, whereas `ls` is an **external executable** that we have not yet added to our environment.
Now, let's try to add the `ls` command into our jailed environment like we did previously with bash.

## Adding `ls` and Its Libraries
Let us locate the `ls` executable in the system.
```bash
$ command -v ls
alias ls='ls --color=auto'
$ type -P ls                 # locate the executable
/usr/bin/ls
$ file /usr/bin/ls           # verify that the file is executable
/usr/bin/ls: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=4e297d3b427342e1da6b66f5ca0fd279f43f3afe, for GNU/Linux 4.4.0, stripped
```
Then, list the required libraries
```bash
$ ldd /usr/bin/ls
	linux-vdso.so.1 (0x00007f6a8a692000)
	libcap.so.2 => /usr/lib/libcap.so.2 (0x00007f6a8a627000)
	libc.so.6 => /usr/lib/libc.so.6 (0x00007f6a8a400000)
	/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007f6a8a694000)
```
> Notice that the loader is the same file as before.
Therefore, we only need to copy the executable file and 2 shared object files.
```bash
$ sudo cp /usr/bin/ls /opt/jailroot/usr/bin/
$ sudo cp /usr/lib/libcap.so.2 /opt/jailroot/usr/lib/
$ sudo cp /usr/lib/libc.so.6  /opt/jailroot/usr/lib/
```
Now, we can go back to the jail and run `ls`.
```bash
$ sudo chroot ./jailroot /bin/bash
bash-5.3# ls
bin  lib  lib64  usr
bash-5.3#
```

