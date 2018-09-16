# Paperbots
Paperbots is an analogue, extensible programming game to teach structured imperative programming.

The player is control of a self-made paper robot that has to complete quests. A quest is played on a grid on a piece of paper. Each quests consist of a grid setup and a description of the quest. The player then writes down a program to solve the quest in the Paperlang programming language and executes it. Execution is performed by the player themself by going through each statement of their program and evaluating it, e.g. by moving the robot on the grid, modifying the value of a variable, evaluating a function call, etc.

A Paperbot quest may be designed for a single or multiple players. Players may also bring along their library of previously written programs and functions to solve new quests. It is up to the quest designed what is and isn’t allowed.

## Motivation

Paperbots is inspired by digital programming games like [Robocode](https://robocode.sourceforge.io/), [Swift Playgrounds](https://www.apple.com/swift/playgrounds/), or [CodeCombat](https://codecombat.com/).

While this digital programming games are great at conveying the basics of programming, it may be to hard for beginners to extend these environments with more “advanced” functionality. E.g. adding path finding to a digital programming game requires advanced programming skills and computer science knowledge. In Paperbots, players can declare a new function and merely describe its semantics.

Paperbots players are forced to learn the skill of [tracing](http://users.csc.calpoly.edu/~jdalbey/101/Resources/codetrace.html). In digital programming games, a computer executes each statement of a program for the player, conveying programming execution on screen by animation. In Paperbots, the players execute their own program, by manually tracing through it and executing the respective action behind a statement. This process not only includes executing commands, but also updating the values of variables. The downside to this approach is that complex programs get tiresome to manually execute.

Paperbots games can be played anywhere with only a pencil, an eraser and paper. This includes school breaks, bus rides and other contexts where a digital device may not be readily available or even forbidden.

Digital programming games support visual and linguistic learning types, but don't necessarily support the aural or kinesthetic learner. Paperbots supports the visual, linguistic, and kinesthetic learning type.

## Game Setup

To play Paperbots you need:

1. A pencil
2. A few pieces of paper
3. An eraser

Paperbots is played on a grid of 1x1cm big cells. The size of the grid depends on the quest that's being played. A grid spanning most of a letter sized paper should be sufficient for most quests. This repository contains a grid template in [Microsoft Word](grid.docx) and [PDF](grid.pdf) format that you can print out. Alternatively, you can use grid paper and draw a grid of 1x1cm cells on it. Here's what the grid template looks like

![images/grid.jpg](images/grid.jpg)