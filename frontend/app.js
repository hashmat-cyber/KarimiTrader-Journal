const API = "/api";


async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "include",
        ...options
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error || "Something went wrong."
        );
    }

    return data;
}


function showMessage(
    element,
    text,
    type = "error"
) {
    if (!element) return;

    element.textContent = text;

    element.className =
        `message ${type}`;
}


function money(value) {
    const number = Number(
        value || 0
    );

    return `$${number.toFixed(2)}`;
}


function resultClass(result) {
    if (result === "Win") {
        return "result-win";
    }

    if (result === "Loss") {
        return "result-loss";
    }

    return "result-breakeven";
}


function directionClass(direction) {
    return direction === "Buy"
        ? "direction-buy"
        : "direction-sell";
}


function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function tradeCard(trade) {
    return `
        <div class="trade-card">

            <div class="trade-main">

                <div>

                    <div class="trade-symbol">
                        ${escapeHtml(trade.symbol)}
                    </div>

                    <div class="trade-date">
                        ${escapeHtml(trade.trade_date)}
                    </div>

                </div>


                <strong
                    class="${directionClass(trade.direction)}"
                >
                    ${escapeHtml(trade.direction)}
                </strong>


                <strong
                    class="${resultClass(trade.result)}"
                >
                    ${escapeHtml(trade.result)}
                </strong>

            </div>


            <div
                class="trade-pl ${
                    trade.profit_loss >= 0
                        ? "result-win"
                        : "result-loss"
                }"
            >
                ${money(trade.profit_loss)}
            </div>


            <a
                class="btn btn-outline"
                href="/trade-detail.html?id=${trade.id}"
            >
                View
            </a>

        </div>
    `;
}


/* -------------------------
   AUTH CHECK
------------------------- */

async function checkAuth() {
    try {
        return await apiRequest(
            `${API}/me`
        );

    } catch {
        return {
            authenticated: false
        };
    }
}


async function protectPage() {
    const result = await checkAuth();

    if (!result.authenticated) {
        window.location.href =
            "/login.html";

        return false;
    }

    return true;
}


/* -------------------------
   LOGIN
------------------------- */

const loginForm =
    document.getElementById(
        "loginForm"
    );

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document.getElementById(
                    "email"
                ).value;

            const password =
                document.getElementById(
                    "password"
                ).value;

            const message =
                document.getElementById(
                    "message"
                );

            try {

                const data =
                    await apiRequest(
                        `${API}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email,
                                    password
                                })
                        }
                    );

                showMessage(
                    message,
                    data.message,
                    "success"
                );

                setTimeout(() => {
                    window.location.href =
                        "/dashboard.html";
                }, 700);

            } catch (error) {

                showMessage(
                    message,
                    error.message
                );
            }
        }
    );
}


/* -------------------------
   REGISTER
------------------------- */

const registerForm =
    document.getElementById(
        "registerForm"
    );

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const username =
                document.getElementById(
                    "username"
                ).value;

            const email =
                document.getElementById(
                    "email"
                ).value;

            const password =
                document.getElementById(
                    "password"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;

            const message =
                document.getElementById(
                    "message"
                );

            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    message,
                    "Passwords do not match."
                );

                return;
            }

            try {

                const data =
                    await apiRequest(
                        `${API}/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    username,
                                    email,
                                    password
                                })
                        }
                    );

                showMessage(
                    message,
                    data.message,
                    "success"
                );

                setTimeout(() => {
                    window.location.href =
                        "/dashboard.html";
                }, 700);

            } catch (error) {

                showMessage(
                    message,
                    error.message
                );
            }
        }
    );
}


/* -------------------------
   LOGOUT
------------------------- */

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await apiRequest(
                    `${API}/logout`,
                    {
                        method: "POST"
                    }
                );

            } finally {

                window.location.href =
                    "/";
            }
        }
    );
}


/* -------------------------
   DASHBOARD
------------------------- */

async function loadDashboard() {

    const totalTrades =
        document.getElementById(
            "totalTrades"
        );

    if (!totalTrades) return;

    if (!(await protectPage())) {
        return;
    }

    try {

        const user =
            await checkAuth();

        const stats =
            await apiRequest(
                `${API}/stats`
            );

        const trades =
            await apiRequest(
                `${API}/trades`
            );


        document.getElementById(
            "welcomeText"
        ).textContent =
            `Welcome back, ${user.user.username}.`;


        document.getElementById(
            "totalTrades"
        ).textContent =
            stats.total_trades;


        document.getElementById(
            "wins"
        ).textContent =
            stats.wins;


        document.getElementById(
            "losses"
        ).textContent =
            stats.losses;


        document.getElementById(
            "winRate"
        ).textContent =
            `${stats.win_rate}%`;


        document.getElementById(
            "totalProfit"
        ).textContent =
            money(
                stats.total_profit_loss
            );

        const performanceWins =
            document.getElementById("performanceWins");

        const performanceLosses =
            document.getElementById("performanceLosses");

        const performanceRate =
            document.getElementById("performanceRate");

        const winrateProgress =
            document.getElementById("winrateProgress");

        if (performanceWins) {
            performanceWins.textContent = stats.wins;
        }

        if (performanceLosses) {
            performanceLosses.textContent = stats.losses;
        }

        if (performanceRate) {
            performanceRate.textContent =
                `${stats.win_rate}%`;
        }

        if (winrateProgress) {
            winrateProgress.style.width =
                `${Math.min(Math.max(Number(stats.win_rate) || 0, 0), 100)}%`;
        }


        const recent =
            document.getElementById(
                "recentTrades"
            );


        if (!trades.length) {

            recent.innerHTML = `
                <div class="empty-state">
                    No trades recorded yet.
                </div>
            `;

            return;
        }


        recent.innerHTML =
            trades
                .slice(0, 5)
                .map(tradeCard)
                .join("");

    } catch (error) {

        console.error(error);
    }
}


/* -------------------------
   NEW TRADE
------------------------- */

const tradeForm =
    document.getElementById(
        "tradeForm"
    );

if (tradeForm) {

    protectPage();


    const dateInput =
        tradeForm.querySelector(
            '[name="trade_date"]'
        );


    if (dateInput) {

        const now =
            new Date();

        now.setMinutes(
            now.getMinutes() -
            now.getTimezoneOffset()
        );

        dateInput.value =
            now.toISOString()
                .slice(0, 16);
    }


    tradeForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "tradeMessage"
                );


            const formData =
                new FormData(
                    tradeForm
                );


            const beforeFile =
                tradeForm.querySelector(
                    '[name="before_screenshot"]'
                );


            const afterFile =
                tradeForm.querySelector(
                    '[name="after_screenshot"]'
                );


            if (
                beforeFile &&
                beforeFile.files.length > 0
            ) {

                const file =
                    beforeFile.files[0];

                if (
                    file.size >
                    10 * 1024 * 1024
                ) {

                    showMessage(
                        message,
                        "Before Trade image is too large. Maximum size is 10MB."
                    );

                    return;
                }
            }


            if (
                afterFile &&
                afterFile.files.length > 0
            ) {

                const file =
                    afterFile.files[0];

                if (
                    file.size >
                    10 * 1024 * 1024
                ) {

                    showMessage(
                        message,
                        "After Trade image is too large. Maximum size is 10MB."
                    );

                    return;
                }
            }


            const totalSize =
                (
                    beforeFile?.files[0]?.size ||
                    0
                ) +
                (
                    afterFile?.files[0]?.size ||
                    0
                );


            if (
                totalSize >
                10 * 1024 * 1024
            ) {

                showMessage(
                    message,
                    "The two images together cannot exceed 10MB."
                );

                return;
            }


            try {

                showMessage(
                    message,
                    "Saving trade...",
                    "success"
                );


                const data =
                    await apiRequest(
                        `${API}/trades`,
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                showMessage(
                    message,
                    data.message,
                    "success"
                );


                tradeForm.reset();


                setTimeout(() => {

                    window.location.href =
                        "/trades.html";

                }, 700);


            } catch (error) {

                showMessage(
                    message,
                    error.message
                );
            }
        }
    );
}


/* -------------------------
   TRADES LIST
------------------------- */

let allTrades = [];


async function loadTrades() {

    const container =
        document.getElementById(
            "tradesContainer"
        );

    if (!container) return;

    if (!(await protectPage())) {
        return;
    }


    try {

        allTrades =
            await apiRequest(
                `${API}/trades`
            );

        renderTrades();

    } catch (error) {

        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}


function renderTrades() {

    const container =
        document.getElementById(
            "tradesContainer"
        );

    const search =
        document.getElementById(
            "tradeSearch"
        );

    const result =
        document.getElementById(
            "resultFilter"
        );

    if (!container) return;


    const searchValue =
        search?.value
            .toLowerCase() || "";


    const resultValue =
        result?.value || "";


    const filtered =
        allTrades.filter(
            trade => {

                const matchesSearch =
                    (trade.symbol || "")
                        .toLowerCase()
                        .includes(
                            searchValue
                        );


                const matchesResult =
                    !resultValue ||
                    trade.result ===
                        resultValue;


                return (
                    matchesSearch &&
                    matchesResult
                );
            }
        );


    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-state">
                No trades found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        filtered
            .map(tradeCard)
            .join("");
}


const tradeSearch =
    document.getElementById(
        "tradeSearch"
    );

if (tradeSearch) {

    tradeSearch.addEventListener(
        "input",
        renderTrades
    );
}


const resultFilter =
    document.getElementById(
        "resultFilter"
    );

if (resultFilter) {

    resultFilter.addEventListener(
        "change",
        renderTrades
    );
}


/* -------------------------
   TRADE DETAIL
------------------------- */

async function loadTradeDetail() {

    const container =
        document.getElementById(
            "tradeDetail"
        );

    if (!container) return;

    if (!(await protectPage())) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    if (!id) {

        container.innerHTML = `
            <div class="empty-state">
                Trade ID not found.
            </div>
        `;

        return;
    }


    try {

        const trade =
            await apiRequest(
                `${API}/trades/${id}`
            );


        let beforeScreenshot =
            "";


        let afterScreenshot =
            "";


        if (
            trade.before_screenshot
        ) {

            beforeScreenshot = `
                <div class="form-section">

                    <h2>
                        Before Trade
                    </h2>

                    <img
                        class="trade-image"
                        src="/uploads/${encodeURIComponent(
                            trade.before_screenshot
                        )}"
                        alt="Before trade screenshot"
                    >

                </div>
            `;

        } else if (
            trade.screenshot
        ) {

            /*
             * Compatibility with old trades.
             */

            beforeScreenshot = `
                <div class="form-section">

                    <h2>
                        Chart Screenshot
                    </h2>

                    <img
                        class="trade-image"
                        src="/uploads/${encodeURIComponent(
                            trade.screenshot
                        )}"
                        alt="Trade screenshot"
                    >

                </div>
            `;
        }


        if (
            trade.after_screenshot
        ) {

            afterScreenshot = `
                <div class="form-section">

                    <h2>
                        After Trade
                    </h2>

                    <img
                        class="trade-image"
                        src="/uploads/${encodeURIComponent(
                            trade.after_screenshot
                        )}"
                        alt="After trade screenshot"
                    >

                </div>
            `;
        }


        if (
            !beforeScreenshot &&
            !afterScreenshot
        ) {

            beforeScreenshot = `
                <div class="form-section">

                    <h2>
                        Trade Screenshots
                    </h2>

                    <p class="hint">
                        No screenshots uploaded.
                    </p>

                </div>
            `;
        }


        container.innerHTML = `

            <div class="detail-grid">


                <div class="detail-item">

                    <span>
                        Date
                    </span>

                    <strong>
                        ${escapeHtml(
                            trade.trade_date
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Symbol
                    </span>

                    <strong>
                        ${escapeHtml(
                            trade.symbol
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Direction
                    </span>

                    <strong
                        class="${directionClass(
                            trade.direction
                        )}"
                    >
                        ${escapeHtml(
                            trade.direction
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Result
                    </span>

                    <strong
                        class="${resultClass(
                            trade.result
                        )}"
                    >
                        ${escapeHtml(
                            trade.result
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Entry
                    </span>

                    <strong>
                        ${trade.entry_price ?? "-"}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Stop Loss
                    </span>

                    <strong>
                        ${trade.stop_loss ?? "-"}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Take Profit
                    </span>

                    <strong>
                        ${trade.take_profit ?? "-"}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Lot Size
                    </span>

                    <strong>
                        ${trade.lot_size ?? "-"}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Profit / Loss
                    </span>

                    <strong
                        class="${
                            trade.profit_loss >= 0
                                ? "result-win"
                                : "result-loss"
                        }"
                    >
                        ${money(
                            trade.profit_loss
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Strategy
                    </span>

                    <strong>
                        ${
                            escapeHtml(
                                trade.strategy
                            ) || "-"
                        }
                    </strong>

                </div>


            </div>


            <div class="detail-notes">


                <div class="form-section">

                    <h2>
                        Why did I enter?
                    </h2>

                    <p>
                        ${
                            escapeHtml(
                                trade.entry_reason
                            ) ||
                            "No notes."
                        }
                    </p>

                </div>


                <div class="form-section">

                    <h2>
                        Emotion
                    </h2>

                    <p>
                        ${
                            escapeHtml(
                                trade.emotion
                            ) ||
                            "No notes."
                        }
                    </p>

                </div>


                <div class="form-section">

                    <h2>
                        Mistakes
                    </h2>

                    <p>
                        ${
                            escapeHtml(
                                trade.mistakes
                            ) ||
                            "No notes."
                        }
                    </p>

                </div>


                <div class="form-section">

                    <h2>
                        Lesson
                    </h2>

                    <p>
                        ${
                            escapeHtml(
                                trade.lesson
                            ) ||
                            "No notes."
                        }
                    </p>

                </div>


                ${beforeScreenshot}


                ${afterScreenshot}


            </div>
        `;

    } catch (error) {

        container.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}


/* -------------------------
   SETTINGS
------------------------- */

async function loadSettings() {

    const username =
        document.getElementById(
            "settingsUsername"
        );

    if (!username) return;

    if (!(await protectPage())) {
        return;
    }


    try {

        const data =
            await checkAuth();


        document.getElementById(
            "settingsUsername"
        ).textContent =
            data.user.username;


        document.getElementById(
            "settingsEmail"
        ).textContent =
            data.user.email;

    } catch (error) {

        console.error(error);
    }
}


/* -------------------------
   START
------------------------- */

loadDashboard();
loadTrades();
loadTradeDetail();
loadSettings();
