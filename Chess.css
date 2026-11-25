/* =====================================================
   CHESS ARENA - ROYAL EDITION
   Main Design System
===================================================== */

:root {
    --bg: #0b0f18;
    --bg-secondary: #101725;
    --panel: #151e2e;
    --panel-hover: #1c293c;
    --sidebar: #0e1522;
    --border: rgba(218, 180, 91, 0.15);
    --gold: #d6ad58;
    --gold-light: #f1d28a;
    --gold-dark: #9e7838;
    --text: #f2f0e9;
    --muted: #8993a4;
    --danger: #d75b63;
    --success: #57b98a;
    --radius: 15px;
    --sidebar-width: 265px;
    --transition: 0.25s ease;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: "Cairo", sans-serif;
    overflow-x: hidden;
}

button,
input,
select,
textarea {
    font: inherit;
}

button {
    cursor: pointer;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 3px;
}

::selection {
    background: var(--gold);
    color: #111;
}


/* =====================================================
   APP LAYOUT
===================================================== */

.app-container {
    min-height: 100vh;
}

.sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--sidebar-width);
    background: var(--sidebar);
    border-left: 1px solid var(--border);
    padding: 25px 17px;
    display: flex;
    flex-direction: column;
    z-index: 100;
    overflow-y: auto;
    transition: transform var(--transition);
}

.main-content {
    margin-right: var(--sidebar-width);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}


/* =====================================================
   BRAND
===================================================== */

.brand {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 5px 5px 24px;
}

.brand-logo {
    width: 48px;
    height: 48px;
    border: 1px solid var(--gold);
    border-radius: 13px;
    display: grid;
    place-items: center;
    font-size: 32px;
    color: var(--gold-light);
    background: linear-gradient(145deg, #273149, #111827);
    box-shadow: 0 5px 25px rgba(214, 173, 88, 0.12);
}

.brand-info h2 {
    font-size: 16px;
    letter-spacing: 1px;
    font-weight: 900;
}

.brand-info span {
    color: var(--gold);
    font-size: 10px;
    letter-spacing: 2px;
    font-weight: 700;
}

.sidebar-divider {
    height: 1px;
    background: var(--border);
    margin: 14px 0;
}


/* =====================================================
   SIDEBAR MENU
===================================================== */

.sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.menu-title {
    color: var(--muted);
    font-size: 11px;
    font-weight: 800;
    padding: 12px 12px 6px;
}

.nav-item {
    width: 100%;
    min-height: 44px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: #aab4c5;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 13px;
    text-align: right;
    font-size: 13px;
    font-weight: 700;
    transition: var(--transition);
}

.nav-item:hover {
    background: var(--panel);
    color: var(--gold-light);
}

.nav-item.active {
    color: var(--gold-light);
    background: linear-gradient(
        90deg,
        rgba(214, 173, 88, 0.03),
        rgba(214, 173, 88, 0.15)
    );
    border-color: rgba(214, 173, 88, 0.22);
}

.nav-icon {
    width: 25px;
    text-align: center;
    font-size: 20px;
}

.sidebar-footer {
    margin-top: auto;
    padding: 18px 9px 5px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
}

.footer-crown {
    font-size: 31px;
    color: var(--gold);
}

.sidebar-footer strong {
    display: block;
    font-size: 11px;
    color: var(--gold-light);
    letter-spacing: 1px;
}

.sidebar-footer small {
    color: var(--muted);
    font-size: 10px;
}


/* =====================================================
   TOPBAR
===================================================== */

.topbar {
    height: 76px;
    padding: 0 35px;
    background: rgba(16, 23, 37, 0.85);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(15px);
}

.topbar-right,
.topbar-left {
    display: flex;
    align-items: center;
    gap: 17px;
}

.breadcrumb {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 12px;
    color: var(--muted);
}

.breadcrumb strong {
    color: var(--gold-light);
}

.mode-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 12px;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 10px rgba(87, 185, 138, 0.6);
}

.icon-button,
.menu-toggle {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--panel);
    color: var(--gold-light);
    border: 1px solid var(--border);
    font-size: 20px;
    transition: var(--transition);
}

.icon-button:hover,
.menu-toggle:hover {
    background: var(--panel-hover);
}

.menu-toggle {
    display: none;
}


/* =====================================================
   PAGE CONTAINER
===================================================== */

.page-container {
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 35px;
    flex: 1;
}

.page {
    display: none;
    animation: pageEnter 0.35s ease;
}

.page.active {
    display: block;
}

@keyframes pageEnter {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}


/* =====================================================
   HERO
===================================================== */

.hero-section {
    min-height: 340px;
    background:
        radial-gradient(
            circle at 20% 50%,
            rgba(214, 173, 88, 0.13),
            transparent 35%
        ),
        linear-gradient(115deg, #17243a, #101725 65%, #192235);
    border: 1px solid var(--border);
    border-radius: 22px;
    padding: 45px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
}

.hero-content {
    position: relative;
    z-index: 2;
    max-width: 590px;
}

.eyebrow {
    color: var(--gold);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 2px;
}

.hero-content h1 {
    font-size: clamp(27px, 4vw, 43px);
    font-weight: 900;
    line-height: 1.5;
    margin: 13px 0;
}

.hero-content h1 span {
    display: block;
    color: var(--gold-light);
}

.hero-content p {
    max-width: 480px;
    color: #aeb8c9;
    line-height: 2;
    font-size: 13px;
    margin-bottom: 25px;
}

.hero-art {
    width: 260px;
    height: 260px;
    position: relative;
    display: grid;
    place-items: center;
    flex-shrink: 0;
}

.hero-circle {
    position: absolute;
    width: 220px;
    height: 220px;
    border: 1px solid rgba(214, 173, 88, 0.35);
    border-radius: 50%;
    box-shadow:
        0 0 50px rgba(214, 173, 88, 0.08),
        inset 0 0 50px rgba(214, 173, 88, 0.05);
}

.hero-king {
    color: var(--gold-light);
    font-size: 165px;
    text-shadow: 0 10px 45px rgba(214, 173, 88, 0.2);
    z-index: 1;
}

.hero-decoration {
    position: absolute;
    left: 15px;
    top: 15px;
    color: rgba(214, 173, 88, 0.3);
    font-size: 45px;
}


/* =====================================================
   BUTTONS
===================================================== */

.primary-button,
.secondary-button,
.danger-button {
    min-height: 45px;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 800;
    font-size: 13px;
    transition: var(--transition);
}

.primary-button {
    border: 1px solid var(--gold-light);
    background: linear-gradient(135deg, #f0d28b, #bd9146);
    color: #15130f;
    box-shadow: 0 5px 20px rgba(214, 173, 88, 0.12);
}

.primary-button:hover {
    transform: translateY(-2px);
    filter: brightness(1.08);
    box-shadow: 0 8px 25px rgba(214, 173, 88, 0.22);
}

.primary-button span {
    margin-right: 10px;
}

.secondary-button {
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--gold-light);
}

.secondary-button:hover {
    background: var(--panel-hover);
}

.danger-button {
    background: rgba(215, 91, 99, 0.1);
    border: 1px solid rgba(215, 91, 99, 0.3);
    color: #f08d94;
}

.danger-button:hover {
    background: rgba(215, 91, 99, 0.2);
}

.full-button {
    width: 100%;
    margin-top: 14px;
}


/* =====================================================
   SECTION HEADINGS
===================================================== */

.section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 38px 0 18px;
}

.section-heading h2 {
    font-size: 22px;
    margin-top: 4px;
}

.page-header {
    margin-bottom: 28px;
}

.page-header h1 {
    font-size: 29px;
    font-weight: 900;
    margin: 8px 0;
}

.page-header p {
    color: var(--muted);
    font-size: 13px;
}


/* =====================================================
   FEATURE CARDS
===================================================== */

.feature-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 15px;
}

.feature-card {
    position: relative;
    min-height: 215px;
    padding: 22px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--text);
    text-align: right;
    transition: var(--transition);
    overflow: hidden;
}

.feature-card:hover {
    transform: translateY(-5px);
    border-color: rgba(214, 173, 88, 0.5);
    background: var(--panel-hover);
}

.featured-card {
    background: linear-gradient(145deg, #273149, #151e2e);
}

.feature-icon {
    display: block;
    color: var(--gold-light);
    font-size: 37px;
    margin-bottom: 12px;
}

.feature-label {
    display: block;
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--gold);
    font-weight: 900;
}

.feature-card h3 {
    font-size: 16px;
    margin: 5px 0;
}

.feature-card p {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.9;
}

.feature-arrow {
    position: absolute;
    left: 18px;
    bottom: 18px;
    color: var(--gold);
    font-size: 19px;
}


/* =====================================================
   SECONDARY CARDS
===================================================== */

.secondary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
}

.secondary-card {
    display: flex;
    align-items: center;
    gap: 15px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 13px;
    padding: 18px;
    text-align: right;
    color: var(--text);
    transition: var(--transition);
}

.secondary-card:hover {
    border-color: var(--gold);
    background: var(--panel-hover);
}

.secondary-card > span {
    font-size: 33px;
    color: var(--gold-light);
}

.secondary-card div {
    flex: 1;
}

.secondary-card h3 {
    font-size: 14px;
}

.secondary-card p {
    font-size: 11px;
    color: var(--muted);
}

.secondary-card b {
    color: var(--gold);
    font-size: 20px;
}


/* =====================================================
   PANELS AND FORMS
===================================================== */

.panel-card {
    padding: 22px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    min-width: 0;
}

.panel-card h3 {
    font-size: 16px;
    margin-bottom: 18px;
}

.panel-card label {
    display: block;
    color: #c1cad8;
    font-size: 12px;
    margin: 14px 0 7px;
    font-weight: 700;
}

.panel-card select,
.panel-card input[type="search"],
.panel-card textarea,
.filter-bar select,
.filter-bar input {
    width: 100%;
    background: #0e1624;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 11px 13px;
    outline: none;
    font-size: 12px;
}

.panel-card select:focus,
.panel-card input:focus,
.panel-card textarea:focus,
.filter-bar select:focus,
.filter-bar input:focus {
    border-color: var(--gold);
}

.panel-card textarea {
    min-height: 100px;
    resize: vertical;
}

.panel-card input[type="checkbox"] {
    accent-color: var(--gold);
    margin-left: 8px;
}


/* =====================================================
   GAME LAYOUT
===================================================== */

.game-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(270px, 0.85fr);
    gap: 20px;
    align-items: start;
}

.game-board-panel {
    padding: 20px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
}

.board-player {
    min-height: 58px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.board-player > div {
    flex: 1;
}

.board-player strong {
    font-size: 13px;
}

.board-player small {
    display: block;
    color: var(--muted);
    font-size: 10px;
}

.board-player > strong:last-child {
    color: var(--gold-light);
    background: #0d1421;
    padding: 7px 12px;
    border-radius: 8px;
    font-variant-numeric: tabular-nums;
}

.player-avatar {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: #243149;
    color: var(--gold-light);
    font-size: 25px;
}


/* =====================================================
   CHESS BOARD
===================================================== */

.chess-board {
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 600px;
    margin: 15px auto;
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    grid-template-rows: repeat(8, minmax(0, 1fr));
    border: 4px solid #9e7838;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
    background: #d9c49a;
}

.chess-square {
    display: grid;
    place-items: center;
    position: relative;
    min-width: 0;
    min-height: 0;
    cursor: pointer;
    user-select: none;
    transition: background 0.12s ease;
}

.chess-square.light {
    background: #e8d8b5;
}

.chess-square.dark {
    background: #98744d;
}

.chess-square.selected {
    background: #c6a34f;
}

.chess-square.possible-move::after {
    content: "";
    position: absolute;
    width: 25%;
    height: 25%;
    background: rgba(20, 20, 20, 0.3);
    border-radius: 50%;
    pointer-events: none;
}

.chess-square.last-move {
    background: rgba(226, 196, 91, 0.65);
}

.chess-square.in-check {
    background: rgba(210, 65, 65, 0.8);
}

.chess-piece {
    font-family: "DejaVu Sans", "Arial Unicode MS", sans-serif;
    font-size: clamp(22px, 5vw, 48px);
    line-height: 1;
    z-index: 1;
    cursor: grab;
    user-select: none;
}

.chess-piece.white-piece {
    color: #fffdf3;
    text-shadow:
        -1px -1px 1px #594d3c,
        1px 1px 2px #594d3c,
        0 2px 4px rgba(0, 0, 0, 0.6);
}

.chess-piece.black-piece {
    color: #20222a;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.chess-square:hover {
    filter: brightness(1.08);
}


/* =====================================================
   GAME CONTROLS
===================================================== */

.game-controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.game-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 9px;
}

.game-actions button,
.analysis-buttons button {
    min-height: 41px;
    background: #0f1725;
    border: 1px solid var(--border);
    color: #c5cfdd;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 700;
    transition: var(--transition);
}

.game-actions button:hover,
.analysis-buttons button:hover {
    color: var(--gold-light);
    border-color: var(--gold);
}

#move-history {
    max-height: 230px;
    overflow-y: auto;
    color: #c5cfdd;
    font-size: 12px;
}

.empty-message {
    color: var(--muted);
    font-size: 12px;
    padding: 10px 0;
}

.game-result {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--panel);
    text-align: center;
}


/* =====================================================
   CONTENT GRIDS
===================================================== */

.content-grid,
.analysis-layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    align-items: start;
}

.lesson-grid,
.tactics-grid,
.endgame-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 15px;
}

.lesson-card,
.tactic-card,
.endgame-card {
    min-height: 165px;
    background: var(--panel);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius);
    text-align: right;
    padding: 22px;
    transition: var(--transition);
}

.lesson-card:hover,
.tactic-card:hover,
.endgame-card:hover {
    transform: translateY(-4px);
    border-color: var(--gold);
    background: var(--panel-hover);
}

.lesson-card > span {
    display: block;
    color: var(--gold);
    font-size: 24px;
    font-weight: 900;
}

.tactic-card > span,
.endgame-card > span {
    display: block;
    color: var(--gold-light);
    font-size: 37px;
    margin-bottom: 10px;
}

.lesson-card h3,
.tactic-card h3,
.endgame-card h3 {
    font-size: 15px;
    margin: 7px 0;
}

.lesson-card p,
.tactic-card p,
.endgame-card p {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.8;
}

.lesson-view,
#tactic-details,
#endgame-details {
    margin-top: 20px;
    line-height: 2;
    color: #c2cbd8;
}


/* =====================================================
   OPENINGS
===================================================== */

.filter-bar {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 12px;
    margin-bottom: 18px;
}

.opening-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 13px;
    margin-bottom: 18px;
}

.opening-card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 13px;
    padding: 18px;
    color: var(--text);
    text-align: right;
    transition: var(--transition);
}

.opening-card:hover {
    border-color: var(--gold);
    transform: translateY(-3px);
}

.opening-card h3 {
    font-size: 14px;
    margin-bottom: 7px;
}

.opening-card p {
    font-size: 11px;
    color: var(--muted);
}

.opening-card span {
    color: var(--gold);
    font-size: 10px;
}


/* =====================================================
   ANALYSIS
===================================================== */

.analysis-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.analysis-layout .panel-card {
    min-width: 0;
}

#analysis-result,
#puzzle-feedback {
    margin-top: 15px;
    padding: 12px;
    background: #0e1624;
    border-radius: 9px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.9;
}


/* =====================================================
   STATISTICS
===================================================== */

.statistics-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
    margin-bottom: 20px;
}

.stat-card {
    padding: 22px;
    background: linear-gradient(145deg, #1a263a, #131c2b);
    border: 1px solid var(--border);
    border-radius: 13px;
}

.stat-card span {
    display: block;
    color: var(--muted);
    font-size: 11px;
}

.stat-card strong {
    display: block;
    color: var(--gold-light);
    font-size: 29px;
    margin-top: 7px;
}


/* =====================================================
   SETTINGS
===================================================== */

.settings-layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}


/* =====================================================
   FOOTER
===================================================== */

.main-footer {
    text-align: center;
    padding: 24px;
    border-top: 1px solid var(--border);
    background: var(--bg-secondary);
}

.main-footer strong {
    color: var(--gold);
    font-size: 12px;
    letter-spacing: 2px;
}

.main-footer p {
    color: var(--muted);
    font-size: 10px;
    margin-top: 4px;
}


/* =====================================================
   LIGHT THEME
===================================================== */

body.light-theme {
    --bg: #eeeae0;
    --bg-secondary: #f7f4ec;
    --panel: #fffdf7;
    --panel-hover: #f0eadc;
    --sidebar: #f7f4ec;
    --border: rgba(139, 105, 46, 0.2);
    --text: #252a32;
    --muted: #737987;
}

body.light-theme .topbar {
    background: rgba(247, 244, 236, 0.92);
}

body.light-theme .nav-item {
    color: #555d69;
}

body.light-theme .nav-item.active {
    color: #8a682e;
}

body.light-theme .panel-card select,
body.light-theme .panel-card input,
body.light-theme .panel-card textarea,
body.light-theme .filter-bar select,
body.light-theme .filter-bar input,
body.light-theme .game-actions button,
body.light-theme .analysis-buttons button {
    background: #f1eee6;
    color: #252a32;
}

body.light-theme .feature-card,
body.light-theme .secondary-card,
body.light-theme .lesson-card,
body.light-theme .tactic-card,
body.light-theme .endgame-card,
body.light-theme .opening-card {
    color: #252a32;
}


/* =====================================================
   BOARD STYLES
===================================================== */

body.board-wood .chess-square.light {
    background: #e3bd8d;
}

body.board-wood .chess-square.dark {
    background: #875332;
}

body.board-royal .chess-square.light {
    background: #e6d6b0;
}

body.board-royal .chess-square.dark {
    background: #596c72;
}

body.board-green .chess-square.light {
    background: #eeeed2;
}

body.board-green .chess-square.dark {
    background: #769656;
}


/* =====================================================
   SCROLLBARS
===================================================== */

::-webkit-scrollbar {
    width: 7px;
    height: 7px;
}

::-webkit-scrollbar-track {
    background: var(--bg);
}

::-webkit-scrollbar-thumb {
    background: #39465a;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--gold-dark);
}


/* =====================================================
   RESPONSIVE - TABLET
===================================================== */

@media (max-width: 1100px) {

    :root {
        --sidebar-width: 235px;
    }

    .page-container {
        padding: 25px;
    }

    .feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .game-layout {
        grid-template-columns: 1fr;
    }

    .game-board-panel {
        max-width: 620px;
    }

    .game-controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
    }

    .game-controls .panel-card:last-child {
        grid-column: 1 / -1;
    }

    .statistics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}


/* =====================================================
   RESPONSIVE - MOBILE
===================================================== */

@media (max-width: 760px) {

    :root {
        --sidebar-width: 270px;
    }

    .sidebar {
        transform: translateX(100%);
        box-shadow: -10px 0 40px rgba(0, 0, 0, 0.35);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .main-content {
        margin-right: 0;
    }

    .topbar {
        height: 65px;
        padding: 0 15px;
    }

    .menu-toggle {
        display: block;
    }

    .topbar-right,
    .topbar-left {
        gap: 10px;
    }

    .breadcrumb {
        font-size: 10px;
        gap: 6px;
    }

    .mode-status {
        font-size: 10px;
    }

    .page-container {
        padding: 18px 14px;
    }

    .hero-section {
        padding: 27px 22px;
        min-height: 300px;
    }

    .hero-art {
        width: 120px;
        height: 160px;
        opacity: 0.5;
        position: absolute;
        left: -15px;
        bottom: 0;
    }

    .hero-circle {
        width: 120px;
        height: 120px;
    }

    .hero-king {
        font-size: 95px;
    }

    .hero-decoration {
        font-size: 25px;
    }

    .hero-content {
        max-width: 100%;
    }

    .hero-content h1 {
        font-size: 27px;
    }

    .hero-content p {
        font-size: 11px;
        max-width: 90%;
    }

    .feature-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }

    .feature-card {
        min-height: 190px;
        padding: 15px;
    }

    .feature-card h3 {
        font-size: 13px;
    }

    .feature-card p {
        font-size: 10px;
    }

    .feature-icon {
        font-size: 30px;
    }

    .secondary-grid {
        grid-template-columns: 1fr;
    }

    .section-heading {
        margin-top: 28px;
    }

    .page-header h1 {
        font-size: 23px;
    }

    .game-board-panel {
        padding: 10px;
    }

    .game-controls {
        display: flex;
    }

    .content-grid,
    .analysis-layout,
    .settings-layout {
        grid-template-columns: 1fr;
    }

    .lesson-grid,
    .tactics-grid,
    .endgame-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }

    .lesson-card,
    .tactic-card,
    .endgame-card {
        min-height: 145px;
        padding: 15px;
    }

    .opening-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .filter-bar {
        grid-template-columns: 1fr;
    }

    .statistics-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
    }

    .stat-card {
        padding: 15px;
    }

    .stat-card strong {
        font-size: 24px;
    }
}


/* =====================================================
   SMALL MOBILE
===================================================== */

@media (max-width: 390px) {

    .feature-grid,
    .lesson-grid,
    .tactics-grid,
    .endgame-grid,
    .opening-grid {
        grid-template-columns: 1fr;
    }

    .hero-content h1 {
        font-size: 23px;
    }

    .breadcrumb span:first-child {
        display: none;
    }

    .mode-status {
        display: none;
    }

    .game-actions {
        grid-template-columns: 1fr 1fr;
    }
}


/* =====================================================
   ACCESSIBILITY
===================================================== */

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
