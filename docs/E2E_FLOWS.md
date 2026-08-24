# Inkpostor E2E Test Flow Diagrams

This document provides visual Mermaid flow diagrams for all 35 End-to-End (E2E) spec files in the Inkpostor test suite. Each diagram maps the multi-client state machine, phase transitions, and assertions executed by Playwright.

---

## Index of E2E Flow Diagrams

1. [Game Loops & Modes](#1-game-loops--modes)
   - `full-game-classic.spec.ts`
   - `full-game-chaos.spec.ts`
   - `multi-round-hotword.spec.ts`
   - `original-mode.spec.ts`
   - `original-chaos-mode.spec.ts`
   - `original-turn-order.spec.ts`
   - `original-virtual-voting.spec.ts`
2. [Multi-Impostor Suites](#2-multi-impostor-suites)
   - `multi-impostor.spec.ts`
   - `multi-impostor-hotword.spec.ts`
   - `multi-impostor-customword.spec.ts`
   - `multi-impostor-original.spec.ts`
3. [Impostor Secret Word Guesses](#3-impostor-secret-word-guesses)
   - `impostor-guess-game.spec.ts`
   - `impostor-inphase-guess.spec.ts`
   - `impostor-lethal-pool.spec.ts`
   - `cross-language-guess.spec.ts`
4. [Canvas & Real-Time Sync](#4-canvas--real-time-sync)
   - `canvas-drawing-sync.spec.ts`
   - `canvas-undo-sync.spec.ts`
   - `suspects-marker.spec.ts`
   - `canvas-features.spec.ts`
5. [Network Resilience & Edge Cases](#5-network-resilience--edge-cases)
   - `reconnection.spec.ts`
   - `host-drop-recovery.spec.ts`
   - `host-actions.spec.ts`
   - `backend-docs-edge-cases.spec.ts`
6. [Room Configuration & UI Guards](#6-room-configuration--ui-guards)
   - `multiplayer.spec.ts`
   - `options-modal.spec.ts`
   - `impostor-count-shrinks.spec.ts`
   - `game-mode-staging.spec.ts`
   - `non-host-permissions.spec.ts`
   - `room-capacity-limit.spec.ts`
   - `timer-expirations.spec.ts`
   - `validations-errors.spec.ts`
   - `i18n-language.spec.ts`
   - `sound-options.spec.ts`
7. [Match Simulations](#7-match-simulations)
   - `real-gameplay-matches.spec.ts`
   - `extended-real-gameplay.spec.ts`
   - `more-real-gameplay-matches.spec.ts`

---

## 1. Game Loops & Modes

### `full-game-classic.spec.ts` — Full CLASSIC Game Loop

```mermaid
flowchart TD
    Lobby["3 Players in Lobby"] --> RoleReveal["ROLE_REVEAL: 1 Impostor, 2 Crewmates"]
    RoleReveal --> Drawing["DRAWING: 3 Players Take Turns"]
    Drawing --> Voting["VOTING: Unanimous Vote for Impostor"]
    Voting --> Guess["IMPOSTOR_GUESS: Impostor Skips Final Guess"]
    Guess --> Results["RESULTS: Inkpostor Defeated"]
    Results --> PlayAgain["Host Clicks Play Again"]
    PlayAgain --> LobbyReturn["All 3 Players Return to Lobby"]
```

### `full-game-chaos.spec.ts` — Full CUSTOM_WORD Chaos Journey

```mermaid
flowchart TD
    Start["Host Starts Game in CUSTOM_WORD Mode"] --> WordSel["WORD_SELECTION: All 3 Players Write Words"]
    WordSel --> RoleReveal["ROLE_REVEAL: Secret Word Selected from Crewmate Submissions"]
    RoleReveal --> Drawing["DRAWING: Drawing Turns with Secret Category"]
    Drawing --> Voting["VOTING: Crewmates Vote Out Impostor"]
    Voting --> Results["RESULTS: Inkpostor Defeated & Custom Word Shown"]
```

### `multi-round-hotword.spec.ts` — Multi-Round HOT_WORD Rotation

```mermaid
flowchart TD
    Round1["Round 1: Initial Word"] --> Tie1["VOTING: Tie Vote (No Ejection)"]
    Tie1 --> Results1["RESULTS: Next Round Button Enabled"]
    Results1 --> WordReveal2["WORD_REVEAL: New Secret Word Drawn"]
    WordReveal2 --> Drawing2["Round 2: DRAWING with New Secret Word"]
    Drawing2 --> Voting2["VOTING: Impostor Ejected"]
    Voting2 --> Defeated["RESULTS: Inkpostor Defeated"]
```

### `original-mode.spec.ts` — ORIGINAL Spoken Mode (No Canvas)

```mermaid
flowchart TD
    Start["Host Starts Game in ORIGINAL Mode (Virtual Voting ON)"] --> RoleReveal["ROLE_REVEAL: Spoken Mode Roles"]
    RoleReveal --> OrderInfo["ORDER_INFO: Turn Direction & Speaker Order Announced"]
    OrderInfo --> Voting["VOTING: Skip Canvas to Direct Voting"]
    Voting --> Results["RESULTS: Round Outcome"]
```

### `original-chaos-mode.spec.ts` — ORIGINAL_CHAOS Player-Written Word Spoken Journey

```mermaid
flowchart TD
    Start["Host Starts ORIGINAL_CHAOS Mode (Virtual Voting ON)"] --> WordSel["WORD_SELECTION: Players Submit Custom Words"]
    WordSel --> RoleReveal["ROLE_REVEAL: Role & Secret Custom Word Revealed"]
    RoleReveal --> OrderInfo["ORDER_INFO: Spoken Speaker Order Announced"]
    OrderInfo --> Voting["VOTING: Spoken Discussion to Ejection Vote"]
    Voting --> Results["RESULTS: Victory Screen & Word Display"]
```

### `original-virtual-voting.spec.ts` — Spoken Modes Without The Virtual Voting (Default)

```mermaid
flowchart TD
    Start["Host Starts a Spoken Game (Virtual Voting OFF)"] --> RoleReveal["ROLE_REVEAL: Spoken Mode Roles"]
    RoleReveal --> OrderInfo["ORDER_INFO: Speaker Order, No Confirmation Gate"]
    OrderInfo --> Guests["Guests: Waiting For The Host To Reveal"]
    OrderInfo --> HostBtn["Host Only: Reveal Results"]
    HostBtn --> Results["RESULTS: Inkpostors Listed, Secret Word, Play Again"]
    Guests -.-> Results
    OrderInfo -.->|Never Reached| Voting["VOTING"]
```

### `original-turn-order.spec.ts` — ORIGINAL Mode FIXED_ORDER vs RANDOM_ORDER

```mermaid
flowchart TD
    subgraph FIXED_ORDER
        FixedR1["Round 1 Speaker Order: P1 -> P2 -> P3"] --> FixedR2["Round 2 Speaker Order: P1 -> P2 -> P3 (Preserved)"]
    end
    subgraph RANDOM_ORDER
        RandR1["Round 1 Speaker Order: P1 -> P2 -> P3"] --> RandR2["Round 2 Speaker Order: P3 -> P1 -> P2 (Shuffled)"]
    end
```

---

## 2. Multi-Impostor Suites

### `multi-impostor.spec.ts` — 5-Player CLASSIC Multi-Impostor Game

```mermaid
flowchart TD
    subgraph Round1["Round 1"]
        Setup["5 Players, Impostor Count = 2"] --> Reveal1["ROLE_REVEAL: 2 Inkpostors Teammates Revealed"]
        Reveal1 --> Draw1["DRAWING Phase"] --> Vote1["VOTING: Impostor 1 Ejected"]
        Vote1 --> Skip1["IMPOSTOR_GUESS: Impostor 1 Skips Guess"]
        Skip1 --> Res1["RESULTS: 1 Inkpostor Remaining Banner Shown"]
    end
    subgraph Round2["Round 2"]
        Res1 --> NextR["All Active Players Confirm Next Round"]
        NextR --> Draw2["DRAWING Phase"] --> Vote2["VOTING: Impostor 2 Ejected"]
        Vote2 --> Skip2["IMPOSTOR_GUESS: Impostor 2 Skips Guess"]
        Skip2 --> Victory["RESULTS: Inkpostor Defeated & Play Again Button"]
    end
```

### `multi-impostor-hotword.spec.ts` — Multi-Impostor HOT_WORD Journey

```mermaid
flowchart TD
    Round1Res["Round 1: Impostor 1 Ejected (1 Impostor Remaining)"] --> NextR["Next Round Confirmed"]
    NextR --> WordRev["WORD_REVEAL: New Secret Word Revealed"]
    WordRev --> Draw2["Round 2 DRAWING"] --> Vote2["Round 2 VOTING: Impostor 2 Ejected"]
    Vote2 --> Victory["RESULTS: All Inkpostors Eliminated"]
```

### `multi-impostor-customword.spec.ts` — Multi-Impostor CUSTOM_WORD Chaos Journey

```mermaid
flowchart TD
    WordSel["5 Players Submit Words"] --> WordFilter["Word Selection Excludes Both Inkpostor Submissions"]
    WordFilter --> RoleReveal["2 Inkpostors Revealed with Teammates"]
    RoleReveal --> R1["Round 1 Ejection: 1 Inkpostor Left Banner"]
    R1 --> R2["Round 2 Ejection: Final Victory"]
```

### `multi-impostor-original.spec.ts` — Multi-Impostor ORIGINAL Spoken Journey

```mermaid
flowchart TD
    RoleReveal["5 Players: 2 Inkpostors Teammates"] --> Order1["ORDER_INFO Round 1"]
    Order1 --> Vote1["VOTING: Impostor 1 Ejected"]
    Vote1 --> Res1["RESULTS: 1 Inkpostor Remaining"]
    Res1 --> Order2["ORDER_INFO Round 2"]
    Order2 --> Vote2["VOTING: Impostor 2 Ejected"]
    Vote2 --> Victory["RESULTS: Inkpostor Defeated"]
```

---

## 3. Impostor Secret Word Guesses

### `impostor-guess-game.spec.ts` — Impostor Final Guess Feature Flow

```mermaid
flowchart TD
    Eject["Impostor Ejected by Vote"] --> FinalGuessPhase["IMPOSTOR_GUESS Phase: Ejected Impostor Form"]
    FinalGuessPhase -->|Submit Wrong Word| ResFail["RESULTS: Inkpostor Defeated"]
    FinalGuessPhase -->|Submit Correct Word| ResWin["RESULTS: Inkpostor Won"]
```

### `impostor-inphase-guess.spec.ts` — In-Phase Impostor Secret Word Guess

```mermaid
flowchart TD
    Drawing["DRAWING Phase: Impostor In-Phase Guess Button"] --> GuessSubmit["Impostor Submits Correct Secret Word"]
    GuessSubmit --> InstantWin["Instant Transition to RESULTS: Inkpostor Won"]
```

### `impostor-lethal-pool.spec.ts` — Impostor Loses On Lethal Guess Pool Depletion

```mermaid
flowchart TD
    Option["impostorLosesWhenOutOfGuesses: Enabled"] --> WrongGuess["Impostor Submits Wrong In-Phase Guess"]
    WrongGuess --> PoolEmpty["Guess Pool Reaches 0"]
    PoolEmpty --> Defeated["Instant RESULTS: Inkpostor Defeated"]
```

### `cross-language-guess.spec.ts` — Localized Secret Word Validation

```mermaid
flowchart TD
    HostLocale["Host in Spanish: Secret Word = Manzana"] --> ImpLocale["Impostor in English: Submits Apple"]
    ImpLocale --> TranslationCheck["Backend Validates Canonical Dictionary Match"]
    TranslationCheck --> MatchSuccess["Match Confirmed: Inkpostor Won"]
```

---

## 4. Canvas & Real-Time Sync

### `canvas-drawing-sync.spec.ts` — Real-Time Mouse Stroke Broadcasting

```mermaid
flowchart TD
    Drawer["Active Drawer Mouse Down / Move / Up"] --> SocketEmit["Emit canvasDraw Stroke Event"]
    SocketEmit --> BackendRelay["Backend Relays Stroke Data to Room"]
    BackendRelay --> SpectatorRender["Spectator Canvases Render Identical Line Pixels"]
```

### `canvas-undo-sync.spec.ts` — Canvas Undo Stack Sync

```mermaid
flowchart TD
    Draw3["Drawer Draws 3 Strokes"] --> Undo2["Drawer Clicks Undo Twice"]
    Undo2 --> SyncUndo["Backend Broadcasts Stack Update"]
    SyncUndo --> PixelMatch["All Clients Match Exact canvas.toDataURL() Pixel Hash"]
```

### `suspects-marker.spec.ts` — Suspect Marker Persistence

```mermaid
flowchart TD
    Drawing["DRAWING Phase: Player Marks Suspect"] --> MarkerSave["Suspect Saved in Local Component State"]
    MarkerSave --> VotingPhase["Phase Transitions to VOTING"]
    VotingPhase --> MarkerVisible["Suspect Marker Badge Remains Visible on Voting Card"]
```

### `canvas-features.spec.ts` — Emergency Alert & Vote-Kick Flow

```mermaid
flowchart TD
    subgraph EmergencyAlert["Emergency Alert"]
        Draw["DRAWING Phase"] --> Alert["Player Clicks Emergency Alert"]
        Alert --> ImmediateVote["Immediate Transition to VOTING Phase"]
    end
    subgraph VoteKick["Vote-Kick"]
        Draw2["DRAWING Phase"] --> KickVote["2 Players Vote to Kick Player 3"]
        KickVote --> Kicked["Player 3 Removed & Disconnected"]
    end
```

---

## 5. Network Resilience & Edge Cases

### `reconnection.spec.ts` — Network Disconnect & Reconnect Recovery

```mermaid
flowchart TD
    PlayerDrop["Player 2 Socket Disconnects Mid-Game"] --> ServerState["Server Sets isConnected = false"]
    ServerState --> ReconnectWindow["Player 2 Reconnects with Same Session Token"]
    ReconnectWindow --> StateSync["Server Resends Full GameState & Re-enables UI"]
```

### `host-drop-recovery.spec.ts` — Mid-Turn Host Tab Closure

```mermaid
flowchart TD
    HostActive["Host Drawing Turn"] --> HostClose["Host Closes Tab / Drops Socket"]
    HostClose --> TurnReeval["Server Re-evaluates Active Turn Order"]
    TurnReeval --> NextPlayerTurn["Turn Advances to Player 2 Without App Stutter"]
```

### `host-actions.spec.ts` — Host End Game & Room Termination

```mermaid
flowchart TD
    MidGame["Game in Progress"] --> HostEndGame["Host Clicks End Game"]
    HostEndGame --> GameTerminated["room.gameEnded = true, all players returned to RESULTS"]
```

### `backend-docs-edge-cases.spec.ts` — Backend Specification Parity & Disconnect Edge Cases

```mermaid
flowchart TD
    subgraph LobbyKick["Lobby Kick"]
        HostKick["Host Kicks Player from Lobby"] --> TargetRedirect["Target Redirected to Join Screen"]
    end
    subgraph LastVoterDisconnect["Last Voter Disconnect"]
        LastVoter["Last Pending Voter Drops Socket"] --> AutoResolve["Voting Resolves Immediately"]
    end
```

---

## 6. Room Configuration & UI Guards

### `multiplayer.spec.ts` — Room Creation & Joining

```mermaid
flowchart TD
    HostCreate["Host Creates Room"] --> RoomCode["Server Returns 6-Char Code"]
    RoomCode --> Player2Join["Player 2 Joins Room Code"]
    Player2Join --> SyncLobby["Both Players Visible in Lobby Roster"]
```

### `options-modal.spec.ts` — Game Options Modal & Mode Lock Rules

```mermaid
flowchart TD
    OpenModal["Host Opens Options Modal"] --> Modify["Adjust Round Time, Impostor Count, Guess Toggles, Prevent Repeat"]
    Modify --> SelectMode["Select Spoken / Custom Word Mode"]
    SelectMode --> LockRules["Mode Locks Mask Disabled Options with Padlock/Hidden Rules"]
    LockRules --> Save["Save Options -> Server Applies hostGameOptions & gameOptions"]
```

### `prevent-repeat-impostors.spec.ts` — Prevent Repeat Inkpostors Option

```mermaid
flowchart TD
    HostCreate["Host Creates Room"] --> OpenOpt["Host Opens Options Modal"]
    OpenOpt --> CheckToggle["Verify Prevent Repeat Inkpostors Toggle is ON by default"]
    CheckToggle --> ToggleOff["Host Toggles Option OFF & Saves"]
    ToggleOff --> ReopenOpt["Host Re-opens Modal -> Verify OFF state persisted"]
```

### `impostor-count-shrinks.spec.ts` — Inkpostor Count Follows The Room

```mermaid
flowchart TD
    FivePlayers["5 Players in Lobby"] --> SetTwo["Host Sets 2 Inkpostors & Saves"]
    SetTwo --> GuestReads["Guest Opens Options -> Reads 2"]
    GuestReads --> Leaves["One Player Leaves -> 4 Remain"]
    Leaves --> HostCorrects["Host Client Saves the Count 4 Players Allow"]
    HostCorrects --> BackToOne["Host & Guest Both Read 1, Steppers Disabled"]
```

### `game-mode-staging.spec.ts` — Staged Options vs Lock Restoration

```mermaid
flowchart TD
    StageMode["Stage ORIGINAL Mode (Hides Drawing Options)"] --> Cancel["Cancel / Switch Back to CLASSIC"]
    Cancel --> Restored["Drawing Options Restored with Preserved Values"]
```

### `non-host-permissions.spec.ts` — Non-Host UI Permission Guards

```mermaid
flowchart TD
    NonHostView["Non-Host Joins Lobby"] --> Verification["Verify Start Game Button Omitted & Options Modal Read-Only"]
```

### `room-capacity-limit.spec.ts` — 10-Player Capacity Limit Guard

```mermaid
flowchart TD
    Cap10["10 Players Fill Lobby"] --> Player11Join["11th Player Attempts Join"]
    Player11Join --> ErrorToast["Server Rejects with ROOM_FULL Error"]
```

### `timer-expirations.spec.ts` — Turn & Voting Timer Expirations

```mermaid
flowchart TD
    TurnTimeout["Turn Timer Reaches 0"] --> AutoNextTurn["Server Advances Turn Index"]
    VoteTimeout["Voting Timer Reaches 0"] --> AutoSkip["Server Auto-Skips Unsubmitted Votes & Resolves Phase"]
```

### `validations-errors.spec.ts` — Input Validation & Minimal Player Guards

```mermaid
flowchart TD
    BadCode["Enter Invalid Room Code"] --> CodeError["Show 'Room not found' Error"]
    LowPlayers["Lobby with 2 Players"] --> DisabledStart["Start Game Button Disabled"]
```

### `i18n-language.spec.ts` — Dynamic Language Switching

```mermaid
flowchart TD
    ToggleLang["User Toggles Language Selector (EN -> ES -> CA)"] --> Dynamici18n["UI Text Updates Instantly Across All Screens"]
```

### `sound-options.spec.ts` — Sound Effects & Volume Option Controls

```mermaid
flowchart TD
    subgraph Topbar & Quick Toggle
        HostStart["Host Creates Room"] --> TopbarAudio["Topbar Speaker Button (Mute/Unmute)"]
        TopbarAudio --> QuickMute["Click Mutes Audio & Persists in LocalStorage"]
    end

    subgraph Options Modal Sound Controls
        OpenOptions["Open Options Modal"] --> SoundSec["Sound & Volume Section Rendered"]
        SoundSec --> Slider["Adjust Volume Slider (0% - 100%)"]
        SoundSec --> TestBtn["Click 'Test Sound' Audio Preview"]
        SoundSec --> ModalMute["Toggle Mute Switch in Modal"]
        ModalMute --> DisableSlider["Volume Slider & Test Button Disabled"]
    end

    subgraph Multi-Player & Reload Persistence
        PageReload["Reload Page"] --> RestoreSettings["Restores Volume & Mute State from LocalStorage"]
        GuestJoin["Player 2 (Guest) Joins Room"] --> GuestOptions["Guest Opens Options Modal"]
        GuestOptions --> GuestIndependentAudio["Guest Configures Personal Volume & Audio Independently"]
    end

    QuickMute --> OpenOptions
    DisableSlider --> PageReload
    RestoreSettings --> GuestJoin
```

---

## 7. Match Simulations

### `real-gameplay-matches.spec.ts` — Matches 1–5 Real Gameplay Scenarios

```mermaid
flowchart TD
    Match1["Match 1: Unanimous Voting Win"]
    Match2["Match 2: Impostor Victory by Framing Innocent Crewmate"]
    Match3["Match 3: In-Phase Secret Word Clutch"]
    Match4["Match 4: Emergency Alert Vote-Kick"]
    Match5["Match 5: Canvas Line Drawing Sync Verification"]
```

### `extended-real-gameplay.spec.ts` — Matches 6–10 Real Gameplay Scenarios

```mermaid
flowchart TD
    Match6["Match 6: Multi-Round Tie Resolution"]
    Match7["Match 7: 4-Player 3/3 Vote-Kick Threshold"]
    Match8["Match 8: Limited Ink Depletion Mechanics"]
    Match9["Match 9: Rapid 3-Round Game Loop"]
    Match10["Match 10: Disconnect Recovery Mid-Turn"]
```

### `more-real-gameplay-matches.spec.ts` — Matches 11–15 Real Gameplay Scenarios

```mermaid
flowchart TD
    Match11["Match 11: 5-Player Split Vote Tie"]
    Match12["Match 12: Emergency Alert Disconnect Recovery"]
    Match13["Match 13: Color Palette & Eraser Sync"]
    Match14["Match 14: Custom Word Selection Filtering"]
    Match15["Match 15: Lethal Guess Pool Depletion Victory"]
```
