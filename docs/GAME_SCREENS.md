# Inkpostor Game Screens

This document provides a visual guide and showcase of all game screens in **Inkpostor**, organized by game flow phases and user interface states.

---

## Table of Contents
1. [Lobby & Room Setup](#1-lobby--room-setup)
2. [Role Reveal](#2-role-reveal)
3. [Word & Turn Order Setup](#3-word--turn-order-setup)
4. [Canvas & Drawing Phase](#4-canvas--drawing-phase)
5. [Voting Phase](#5-voting-phase)
6. [Results & GameOver](#6-results--game-over)
7. [Modals & Action Dialogs](#7-modals--action-dialogs)

---

## 1. Lobby & Room Setup

### Empty Lobby
Initial state when a host creates a new game room waiting for players to join.
![Empty Lobby](./screens/1.%20Empty%20Lobby.png)

### Medium Lobby
Lobby view with multiple connected players ready to start the game.
![Medium Lobby](./screens/1.1%20Medium%20Lobby.png)

### Game Options Modal
Host options modal for configuring round timers, impostor counts, and gameplay rules.
![Modal Options Lobby](./screens/1.2%20Modal%20Options%20Lobby.png)

### Advanced Options Modal
Extended gameplay options including guess attempt limits and canvas clearing options.
![Modal Options 2 Lobby](./screens/1.2.2%20Modal%20Options%202%20Lobby.png)

### Rules & Instructions Modal
Game rules and instructions modal explaining how to play Inkpostor.
![Modal Rules Lobby](./screens/1.3%20Modal%20Rules%20Lobby.png)

---

## 2. Role Reveal

### Role Reveal Card (Initial)
Covered secret role card before tapping to reveal.
![Reveal Role](./screens/2.%20Reveal%20Role.png)

### Role Reveal - Crewmate (Green)
Role card revealed for Crewmates showing their secret team identity.
![Reveal Role GREEN](./screens/2.1%20Reveal%20Role%20GREEN.png)

### Role Reveal - Inkpostor (Red)
Role card revealed for Inkpostors alerting them to blend in without knowing the secret word.
![Reveal Role RED](./screens/2.2%20Reveal%20Role%20RED.png)

---

## 3. Word & Turn Order Setup

### Write Word Screen
Phase where players submit or write their secret word candidate.
![Write Word Screen](./screens/8.%20Write%20Word%20Screen.png)

### Order Info Screen
Screen displaying the turn order sequence for the upcoming drawing round.
![Order Info Screen](./screens/9.%20Order%20Info%20Screen.png)

### Order Info Screen - Without Virtual Voting
Default shape of the spoken modes: the table votes out loud, so this screen has
no confirmation gate and no round counter. The host closes the game from here
with **Reveal Results** while everybody else waits — the voting screen is never
reached. Turning **Virtual Voting** on in the options brings the gate and the
voting screen back.

---

## 4. Canvas & Drawing Phase

### Main Drawing Canvas
The primary shared drawing board where active players take turns drawing strokes.
![Canvas](./screens/3.%20Canvas.png)

### Active Player Turn (Canvas ME)
Canvas view during the player's active turn with full drawing controls.
![Canvas ME](./screens/3.3%20Canvas%20ME.png)

### Players List Drawer
Top drawer listing all players in the turn rotation.
![Canvas Players](./screens/3.1%20Canvas%20Players.png)

### Suspects Popover
Popover drawer for flagging suspected players during the drawing round.
![Canvas Players Suspects](./screens/3.1.1%20Canvas%20Players%20Suspects.png)

### Emergency Meeting Alert
Emergency alert trigger from the drawing canvas to immediately start voting.
![Canvas Emergency](./screens/3.2%20Canvas%20emergency.png)

### Impostor Word Guess Control
Quick guess bar for Inkpostors to attempt guessing the secret word directly from canvas.
![Canvas Guess](./screens/3.4%20Canvas%20Guess.png)

### Color Palette Drawer
Expanded color palette for drawing tools on canvas.
![Canvas Palette](./screens/3.5%20Canvas%20Palette.png)

---

## 5. Voting Phase

### Voting Screen
Main voting interface where players select who they suspect is an Inkpostor.
![Voting Screen](./screens/4.%20Voting%20Screen.png)

### Voting Screen - Ejected Player
Voting view displaying an ejected player stamped with the EJECTED badge.
![Voting Screen Ejected](./screens/4.1%20Voting%20Screen%20Ejected.png)

### Voting Screen - Inkpostor View
Voting interface view tailored for the Inkpostor with word guessing shortcuts.
![Voting Screen Inkpostor](./screens/4.2%20Voting%20Screen%20Inkpostor.png)

---

## 6. Results & Game Over

> Every case this screen can be in, and every text it can print, is catalogued in
> **[docs/GAME_RESULT.md](./GAME_RESULT.md)**.

### Impostor Word Guess Screen
Dedicated screen for the Inkpostor's final attempt at guessing the secret word.
![Inkpostor Guess Screen](./screens/7.%20Inkpostor%20Guess%20Screen.png)

### Vote Result - Ejected Player Card
Vote outcome displaying the ejected player's card stamped with the EJECTED badge.
![Results Screen Ejected](./screens/5.%20Results%20Screen%20Ejected.png)

### Vote Result - Tie / Nobody Ejected
Vote outcome when a vote ends in a tie or skip result.
![Results Screen None](./screens/5.1%20Results%20Screen%20None.png)

### Game Over - Inkpostor Victory
End of game result screen celebrating an Inkpostor win.
![Results Screen Lose](./screens/6.%20Results%20Screen%20Lose.png)

### Game Over - Crewmate Victory
End of game result screen celebrating a Crewmate win after defeating the Inkpostor.
![Results Screen Win](./screens/6.1%20Results%20Screen%20Win.png)

### Game Over - Impostors Revealed
Shown whenever the game was closed instead of played out: the host ended it with
the End Game button (**in any mode**), or revealed the results of a spoken round
with the virtual voting off. There is no verdict, since nobody won — the title
names the Inkpostors and the cards below it list them, stamped with the INKPOSTOR
badge. The rest of the screen is the usual one — the secret word, Play Again for
the host, Return to Home.

---

## 7. Modals & Action Dialogs

### Exit Game Modal
Confirmation dialog for leaving the room.
![Modal Exit](./screens/10.%20Modal%20Exit.png)

### End Game Modal
Host confirmation modal for terminating the current match.
![Modal End Game](./screens/10.1%20Modal%20End%20Game.png)

### Vote Kick Modal
Modal dialog to initiate or confirm kicking a player from the lobby.
![Modal Vote Kick](./screens/10.2%20Modal%20Vote%20Kick.png)
