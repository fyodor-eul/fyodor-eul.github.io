title: Understanding Access Control List on Linux
image: images/UnderstandingACL/understanding_acl_thumbnail.jpg
description: A practical guide to POSIX Access Control List.
cover: images/UnderstandingACL/understanding_acl_thumbnail.jpg

# Table of Contents

- Why Access Control List Matters
- Viewing ACL Entries
- Adding and Modifying ACL Entries
- Understanding the ACL Mask
- Applying ACL Recursively to Directories
- Setting Default ACL for New Files
- References

# Why Access Control List Matters

Traditionally, file and directory permissions in Linux(UNIX) systems are limited to `user`, `group` and `other`, as we all know. However, this becomes very restrictive when we need more granular control over file permissions. For example, we might want to give permissions to a specific user. What do we do if we want to allow access to multiple groups? What do we do if we need to give access to a user who is neither the owner nor a member of the allowed group? This is where **Access Control List (ACL)** comes in. In this article, we will go over the basics of ACLs in Linux systems (***POSIX ACLs - [acl(5)]([https://man7.org/linux/man-pages/man5/acl.5.html](https://man7.org/linux/man-pages/man5/acl.5.html))***) and its practical use cases.

> Before running any ACL related commands, make sure you have install the required package for your specific linux distribution. For RedHat-based distributions, you can install the `acl` package as follows.
> 

```
dnf install acl
```

# Viewing ACL Entries

You can view the ACL entries of a file with the following command

```
[root@localhost:demo] # getfacl file.txt
# file: file.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--

[root@localhost:demo] #
```

Here we can see that, the **user** in `user::rw-` refers to **root** in `owner: root` and it has read and write access to the file.
Similarly, `group: root` is granted read-only access to the file as defined by `group::r--`.
`other::r--` means read-only access has been set to others.

Since we haven't set any ACL entries, this output directly reflects to that of `ls -l` command.

```
[root@localhost:demo] # ls -l file.txt
-rw-r--r--. 1 root root 0 Dec 14 13:07 file.txt
```

Similarly, the following command demonstrate the ACL entries of the `dir1/` directory.

```
[root@localhost:demo] # getfacl dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

[root@localhost:demo] #

```

> Notice that `dir1/` is considered as a file despite being a directory. This is because, a directory, eventually, is treated as a file from the perspective of the Linux kernel. This implies the idea of Everything is a file in Linux (We will discuss more on files in later articles).
> 

Alternatively, we can recursively list the ACL entries of a directory and its contents with `-R` flag.

```
[root@localhost:demo] # tree dir1/
dir1/
├── file2.txt
└── sub1
    └── sub2

2 directories, 1 file
[root@localhost:demo] # getfacl -R dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1//sub1
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1//sub1/sub2
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1//file2.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--

[root@localhost:demo] #

```

# Adding and Modifying ACL Entries

Unlike traditional UNIX permissions (with `user::rwx`, `group::rwx`, `other::rwx`), using POSIX ACLs grants you more granular control over the the file permissions. 

Adding an ACL entry is a very straight-froward process. You simply need to specify the entry in the format(***ACL entry specification***) which follows this structure.

```
TYPE:NAME:PERM
```

The **TYPE** field can be `user`, `group` or `other`. These may also be written in their short forms: `u`, `g`, and `o` respectively.

The NAME field may be omitted when it is not applicable as in `user::rw-`, `group::r--`, `other::r--`.

## Adding Your First ACL Entry

You can add a new ACL entry using the `setfacl` command with `-m` flag which stands for ***modify***. This flag is followed by an ACL entry specification, and I highly recommend you to refer to ***ACL ENTRIES*** and ***ACL TEXT FORMS*** sections of ***[setfacl(1)]([https://man7.org/linux/man-pages/man1/setfacl.1.html](https://man7.org/linux/man-pages/man1/setfacl.1.html)).***

The following command add an ACL entry for **named user** by granting user `alice` read and write access to `file.txt`.

```
[root@localhost:demo] # setfacl -m user:alice:rw- file.txt
[root@localhost:demo] # getfacl file.txt
# file: file.txt
# owner: root
# group: root
user::rw-
user:alice:rw-
group::r--
mask::rw-
other::r--

[root@localhost:demo] #

```

Here, we can see that a new entry `user:alice:rw-` has been added.

Notice that in the command output of `ls -l`, the last character of the file permission section changes from `.` to `+` meaning that ACL has been applied.

```
# Before the ACL entry is added
-rw-r--r--. 1 root root 0 Dec 15 18:39 file.txt

# After the ACL entry is added
-rw-rw-r--+ 1 root root 0 Dec 15 18:39 file.txt
```

Notice that the group permission also changes from read-only (`r--`) to the permission we have previously granted to alice (`rw-`). We will discuss more on this later when we talk about `umask`.

You can remove this entry using the following command

```
setfacl -x user:alice file.txt
```

Alternatively you can remove all the ACL entries and restore the file to its default permission.

```
setfacl -b file.txt
```

This command resets the ACL to its base permission state.

## More on ACL Entries

You can add an entry for the **named group** in the similar way.

```
setfacl -m group:mgmt:rw- file.txt
```

You can also add multiple entries by separating with commas.

```
setfacl -m u:bob:rw-,g:devteam:rw- file.txt
```

# Understanding the ACL Mask

The mask in ACL defines the maximum effective permission for all the named user and group ACL entries except for `owner` and `other`.

The mask is automatically created whenever we add a new ACL entry for a certain user or a group.

Before adding any ACL entry, there is no line related to the mask exists.

```
[root@localhost:demo] # ls -l test.txt
-rw-r--r--. 1 root root 0 Dec 15 20:41 test.txt
[root@localhost:demo] # getfacl test.txt
# file: test.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--
```

However, after an ACL entry has been added, the mask entry is automatically added as well.

```
[root@localhost:demo] # setfacl -m u:alice:r-- test.txt
[root@localhost:demo] # ls -l test.txt
-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt
[root@localhost:demo] # getfacl test.txt
# file: test.txt
# owner: root
# group: root
user::rw-
user:alice:r--
group::r--
mask::r--
other::r--
```

You can see that the mask entry `mask::r--` has been added automatically.

Notice that the last character of `ls -l` command changes from `.` to `+` suggesting that the ACL has been applied.

```
# Before ACL
-rw-r--r--. 1 root root 0 Dec 15 20:41 test.txt

# After ACL
-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt
```

Let’s add another ACL entry

```
[root@localhost:demo] # setfacl-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt-m u:bob:rw- test.txt
[root@localhost:demo] # getfacl test.txt
# file: test.txt
# owner: root
# group: root
user::rw-
user:bob:rw-
user:alice:r--
group::r--
mask::rw-
other::r--

[root@localhost:demo] # ls -l test.txt
-rw-rw-r--+ 1 root root 0 Dec 15 20:41 test.txt
[root@localhost:demo] #
```

Since mask is the maximum effective permission, we can observe that its value changes accordingly to `rw-`.

Besides, by comparing with the previous output of `ls -l` command, you might have noticed that the group permission bits are changed from `r--` to `rw-` as well.

```
# Before ACL
-rw-r--r--. 1 root root 0 Dec 15 20:41 test.txt
# r-- corresponds to group::r--

# After ACL (add alice)
-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt
# r-- corresponds to mask::r--

# After ACL (add bob)
-rw-rw-r--+ 1 root root 0 Dec 15 20:41 test.txt
# rw- corresponds to mask::rw-
```

This is because when no ACL exists, the group permission bits shown by `ls -l` command correspond directly to : 

```
group::r--
```

which is displayed from `getfacl test.txt` command.

 

However, when we add an ACL entry, the group permission bits correspond to the mask entry instead.

```
mask::rw-
```

You might be wondering what all this complications are for. This is because the mask exists to maintain the compatibility with programs that only understand traditional UNIX permissions (`user` , `group` and `other`). You can think of the mask as a middle man sitting between ACL and traditional UNIX permissions to do the require translations for compatibility.

In a simple language, when you see the last character is `.` , the group permission bits are traditional UNIX permissions.

Similarly when u see the last character is `+`, the POSIX ACL has been applied and the the group permission bits represents the mask.

You can refer to the ***CORRESPONDENCE BETWEEN ACL ENTRIES AND FILE PERMISSION BITS*** section of ***[acl(5)]([https://man7.org/linux/man-pages/man5/acl.5.html](https://man7.org/linux/man-pages/man5/acl.5.html))*** 

## Effective Permissions

An effective permission is the actual permission that is being applied regardless of the permission on ACL entry.

Let’s say we have a file called `file1.txt` and we have give the user **boss** read and write access to the file.

```
[root@localhost:demo] # touch file1.txt
[root@localhost:demo] # setfacl -m u:boss:rw- file1.txt
[root@localhost:demo] # getfacl file1.txt
# file: file1.txt
# owner: root
# group: root
user::rw-
user:boss:rw-
group::r--
mask::rw-
other::r--
```

Notice that the mask `mask::rw-` has been added.

Modifying the mask to `mask::r--` will also restrict the permission granted to the user **boss**.

```
[root@localhost:demo] # setfacl -m mask::r file1.txt
[root@localhost:demo] # getfacl file1.txt
# file: file1.txt
# owner: root
# group: root
user::rw-
user:boss:rw-			#effective:r--
group::r--
mask::r--
other::r--
```

Now the user **boss** can only access the file in read-only mode.

This is probably the another thing you can do with the mask since you can restrict or restore permissions preferably temporarily.

You can temporarily lock down all ACL permissions.

```
setfacl -m m::--- test.txt
```

Later, you can restore access by correcting the mask

```
setfacl -m m::rw- test.txt
```

# Applying ACL Recursively to Directories

You can add an ACL entry on a directory just as in the same way as we did on the files.

```
[root@localhost:demo] # setfacl -m u:bob:rwx dir1/
[root@localhost:demo] # getfacl dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

[root@localhost:demo] #
```

However, this won't effect the files and sub directories under it.

```
[root@localhost:demo] # getfacl dir1/sub1/; getfacl dir1/file2.txt
# file: dir1/sub1/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1/file2.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--

[root@localhost:demo] #

```

> Here, you can see no entry for **bob** has been added.
> 

In order for our ACL entry to be add to the files and sub directories inside, we need to include `-R` option to enable recursive mode as we have previously done with `getfacl` to retrieve ACL specifications of a directory and its content.

```
[root@localhost:demo] # setfacl -b dir1/
[root@localhost:demo] # setfacl -Rm u:bob:rwx dir1/
[root@localhost:demo] # getfacl -R dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

# file: dir1//sub1
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

# file: dir1//sub1/sub2
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

# file: dir1//file2.txt
# owner: root
# group: root
user::rw-
user:bob:rwx
group::r--
mask::rwx
other::r--

[root@localhost:demo] #
```

While you recursively give permission to a directory, it is possible that you accidentally give execute permission on files.

What will you do if you want to give the user **bob** read-only access to `file1.txt` and `file2.txt`.

```
project/
├── file1.txt
└── notes
    └── file2.txt

1 directory, 2 files
```

If you did as the following 

```
setfacl -Rm u:bob:r-- project/
```

The will prevent bob to `cd` into the `project/` and `notes/` directory since we didn’t give execute permission to directories. And bob will never get to read the files. Therefore, we need to give execute permissions.

```
setfacl -Rm u:bob:r-x project/
```

However, doing so will give execute permissions to `file1.txt` and `file2.txt` as well, which we do not intend to.

To avoid giving executing permissions to files, you can give execute permission only on directories using capital letter `X` instead.

```
setfacl -Rm u:bob:r-X project/
```

By doing so, you will grant **bob** to read-only access to the files and read and execute access to its sub directories.

# Understanding Default ACL

POSIX ACL allows us to pre-define entries on a directory for the future files and subdirectories underneath. These pre-defined entries are call default ACLs. Default ACLs are special permission templates that you set on a directory. When anyone creates a file or subdirectory inside that directory, the new iteam automatically inherits permissions from the default ACL.

However, setting default ACLs on a directory will not have effect on the permissions of directory itself nor the existing contents it contains.

The following command is the demonstration of setting a default ACL to a directory tree granting the user `alice` write access to the new files.

```
project/
├── file1.txt
└── notes
    └── file2.txt

1 directory, 2 files
```

```
[root@localhost:demo] # setfacl -dm u:alice:rw- project/
```

Alternatively, we set default ACL as the line below instead of using `-d` flag.

```
[root@localhost:demo] # setfacl -m default:user:alice:rw- project/
```

We can verify this by creating a file or directory under `project/` and checking its ACL entries.

```
[root@localhost:demo] # mkdir project/docs
[root@localhost:demo] # getfacl project/docs/
# file: project/docs/
# owner: root
# group: root
user::rwx
user:alice:rw-
group::r-x
mask::rwx
other::r-x
default:user::rwx
default:user:alice:rw-
default:group::r-x
default:mask::rwx
default:other::r-x

[root@localhost:demo] #
```

We can see that `user:aclice:rw-` has been added automatically.

However, there is a catch. Even though the default ACL is applied on the newly created directory `docs/`, it won’t applied to the preexisting `notes/` directory unless we do told the `getfacl` to set the default ACL recursively.

```
[root@localhost:dir1] # getfacl -R project/
# file: project/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x
default:user::rwx
default:user:alice:rw-
default:group::r-x
default:mask::rwx
default:other::r-x

# file: project//notes
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

...

# file: project//docs
# owner: root
# group: root
user::rwx
user:alice:rw-
group::r-x
mask::rwx
other::r-x
default:user::rwx
default:user:alice:rw-
default:group::r-x
default:mask::rwx
default:other::r-x
```

Here, you can compare the entries for `notes` and `docs`.

To recursively set the default ACL on the directory and its sub-directories. We to set `-R` flag.

```
setfacl -Rdm u:alice:rw- project/
```

To remove a default ACL entry, we can use `-x` flag the same way as we did on removing regular ACL entries.

```
setfacl -d -x u:alice project/
# or alternatively
setfacl -x d:u:alice project/
```

We can remove all default ACL configurations by `-k` flag.

```
[root@localhost:demo] # setfacl -k project/
[root@localhost:demo] # getfacl project/
# file: project/
# owner: root
# group: root
user::rwx
user:bob:r--
group::r-x
mask::r-x
other::r-x

[root@localhost:demo] #
```

In this article, we have gone over how the traditional UNIX permission model is extended to provided more granular control by the POSIX Access Control List. 

In the traditional UNIX permission model, the access to the files and directories are limited to `user`, `group` and `other`.  POSIX ACL solves this by allowing us to set permissions to specific users or groups.

From viewing ACL entries to adding them in practice, we observed various ways we can utilize ACL to our advantage. In addition, we gained the high-level overview of how  ACL is related to the traditional UNIX permissions by understanding the ACL masks and comparing `ls -l` outputs with the masks. If you had read this far, you should see how ACL solves a lot of issues that `chown` and `chmod` alone cannot deal with. Although ACL adds complexity, understanding how ACL works and the way it interacts with the traditional permissions is crucial for administering modern Linux systems safely and reliably.

# References
- [acl(5)]([https://man7.org/linux/man-pages/man5/acl.5.html](https://man7.org/linux/man-pages/man5/acl.5.html)), [getfacl(1)](https://man7.org/linux/man-pages/man1/getfacl.1.html), [setfacl(1)]([https://man7.org/linux/man-pages/man1/setfacl.1.html](https://man7.org/linux/man-pages/man1/setfacl.1.html))
- [How ACL Masks Let You Fine-Tune File Permissions in Linux By Jordan Erickson](https://www.howtogeek.com/how-acl-masks-let-you-fine-tune-file-permissions-in-linux)
- [What relationships tie ACL mask and standard group permission on a file?](https://unix.stackexchange.com/questions/147499/what-relationships-tie-acl-mask-and-standard-group-permission-on-a-file/147502#147502)
