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
1. An eraser
1. A few empty pieces of paper

Paperbots is played on a grid of 1x1cm big cells. The size of the grid depends on the quest that's being played. A grid spanning most of a letter sized paper should be sufficient for most quests. This repository contains a grid template in [Microsoft Word](grid.docx) and [PDF](grid.pdf) format that you can print out. Alternatively, you can use grid paper and draw a grid of 1x1cm cells on it. Here's what the grid template looks like

![images/grid.jpg](images/grid.jpg)

Sometimes you may want to refer to a specific cell on the grid. To make this easier, the grid template labels the columns and rows with numbers. To specify a cell, you can take its column and row number to form what is called a coordinate. The cell in the bottom left corner has the coordinate `(0, 0)`, the cell in the top right corner has the coordinate `(23, 15)` and so on.

> **Note**: the above choice of numbers of columns and rows, as well as the cell size of 1x1cm are completely arbitrary. You can make the grid smaller, the cells smaller, or make them human size. Whatever works best for you!

Next, we need to build a robot that fits into a single cell of our grid. A cell of the template grid is 1x1cm, so our robot should fit into a single cell. The robot most also have a visual indicator showing you which direction it is pointed in. You can be as creative as you want when building your robot, or lazy like me, as shown below.

![images/robot.jpg](images/robot.jpg)

The robot is pointing to the right, indicated by the tip of the triangle. I cut out a piece of 2x1cm piece of paper, folded it in half, and drew a little triangle on it. The fold helps me more easily grab and move the robot around.

You should now have

1. A pencil
2. An eraser
3. A few empty pieces of paper
3. A grid
4. A robot

That's all we need, let's start with our first quest.

## Quest #1: Basic operations
![images/quest-01.jpg](images/quest-01.jpg)

Our robot got stuck in a maintenance tunnel in cell `(0, 0)`. We need it to move back out of the tunnel to the exit in cell `(4, 2)`. We can write a program in the programming language Papyrus that we then send to the robot for it to execute it.

Papyrus programs are written on a piece of paper. A Papyrus program is a list of statements our robot executes in sequence. For example:

```
forward
forward
turnRight
forward
```

Each statement goes in its own line. When the robot executes a program, it goes through the list of statements, from top to bottom, and executes each statement.

There are many different types of statements. The program above only consists of statements of a single type: a call to a function.

The robot comes with a list of built-in functions:

1. `forward`: instructs the robot to move one cell forward in the direction it is facing.
1. `backward`: instructs the robot to move one cell backward, oposite of the direction it is facing.
2. `turnLeft`: instructs the robot to turn counter-clockwise by 90 degrees.
3. `turnRight`: instructs the robot to turn clockwise 90 degrees.

