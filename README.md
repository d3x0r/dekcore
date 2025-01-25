# Dekcore OS

This is a general support system for distributed applications.

## Entities

These are high level abstract objects.  Entities relate to other entities; entities can contain, be contained by, and be attached to other entities.
Attached objects are 'held' by the root object; a player entity might be holding a weapon, wearing armor, holding some other item, these are all attached.
A player might contain any items also, this is like inventory.  A player might contain a bag, which itself contains other items.
Items might be assigned attributes, depending on the environment, such as mass, or size, which can limit how many items might be stored; with a more advanced UI
Entities might be given a shape which then might be used for constraints to be put within another entity.

Entities receive events when they are stored, or attached, or change their container.  When these events happen, then it may react by rejecting the event.  Events
resemble promises; and may be implemented as promised to accept/reject (resolve/reject). which makes the events asynchronous.  Events are often transmitted across
a network connection to the actual handler; many entities exist within some service/operating space that the client has connected to.

Clients may have their own entities locally, which are probably implemented in a local service/worker.


## service

This coordinates a root service instance.  This is responsible for a subset of the objects in the universe.  Only those objects
which originate in this service are tracked, otherwise commands are sent to other services to handle their objects.

A Service has a UID (Universal Identifier) which objects from this service contain.

An object from another service may be cloned, such that it will exist in a different service.


## Operating space

Objects may execute commands in several operating spaces, depending on what tells them to execute.

## Terminals

Terminals are methods of interacting with the dekcore operating spaces.
Terminals I guess may have several personalities depending on what role they normally play.

A generic terminal will prefix commands with '/' and commands that are unprefixed are text that is sent to the core system.... when connected to a remote service 
as ssh or telnet or something, then this is like IRC with slash commands going first to the local system.

Another sort of terminal might quote code to run for the current entity with ` (optional closing ` if there are a chain of commands on the line to do...

Another terminal might be a dedicated user terminal, where commands to entities are not prefixed, there is no further system to send commands to, and 
direct code is not able to be run.



## Features

This evolution should implement command more generically, and extensibly as external scripts, rather than being part of a huge case statement.

## Commands implemented as entity keywords

Commands are sorted with least-case-insensitive match available; all commands are ascii case insensitive.



1) the void exists in one place and all others are chained off of that
2) the void exists in each location and is an independent location that doesn't share or broadcast information?
3) the void is a shared entity that everyone has, and events in the void are transmitted to other voids
4) There is no void?
5) 


1) Environments that run entity sentience - manage sentients are associated with an Entity, but only receive a handle to that Entity.


Entities exists in a management system separate from the scripts themselves.

So what hosts connectivity?
  1) user services in sentients which are entities
  2) entities themselves may hold a context that is the connection, but the creation of that is still managed by a sentience somewhere...  And any onopen/onaccept events have to have a machine behind it to run the code....

Or there's a magic Aether in the system ...

## Sentient Environment/Context

### io

This registers events that are communicated to ...

### entity 

Self; this registers events that are new commands
one can derrive from Entity, and that subclass all shares registered events.
Events/verbs can be triggered to perform actions in the world... `on("east",...)`  `on( "get", ... )`; the first might
move the acting sentice's entity to an 'east' room.  Get is on a room, and allows
an acting sentient entity to get an object from the room...   Some adverbs might be added; `get <thing> from <other thing>`

### command ?

