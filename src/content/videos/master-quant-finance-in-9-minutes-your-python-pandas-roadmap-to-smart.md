---
title: "Using yfinance in Python and How It Changes Market Data"
youtubeId: "oWmWFGP9lOg"
channelTitle: "Vincent Codes Finance"
channelId: "UCuNrwdpvF1LBGJ2cNL5b68w"
publishedAt: "2025-03-07T14:00:31Z"
date: "2026-07-11"
updated: "2026-11-10"
tags:
  - "Investing & Trading"
  - "Coding"
summary: "To use yfinance in Python, install the package with pip and import it to query Yahoo Finance market data directly. The open-source library allows developers to download historical stock prices, balance sheets, and live quotes with minimal code setup. Because the tool scrapes public endpoints without official backing from Yahoo, projects must remain non-commercial and respect endpoint stability limits."
metaDescription: "Learn how to use yfinance in Python to download historical stock prices, fetch company balance sheets, and stream market quotes for personal research."
targetQuestion: "how to use yfinance in python"
duration: "11:04"
viewCount: 21517
viewsUpdated: "2026-11-10"
thumbMax: true
isShort: false
recipe: 3
rewrittenAt: "2026-11-10"
faqs:
  - question: "What is yfinance library in python?"
    answer: "The yfinance library is an open-source Python tool that provides a structured way to fetch publicly available data from Yahoo Finance endpoints. The Python Package Index distributes it under the Apache Software License."
  - question: "What does yfinance do in python?"
    answer: "It downloads historical market figures, balance sheets, and insider trading records directly into Python. The official yfinance documentation adds that it provides WebSocket classes for streaming quotes alongside screening tools to filter market equities."
  - question: "Is yfinance real time?"
    answer: "It can provide real-time data through dedicated streaming classes, but standard ticker calls pull delayed snapshots or historical figures. The official yfinance documentation lists WebSocket and AsyncWebSocket modules specifically for live price streaming."
keyFacts:
  - text: "Users install the library from PyPI using the terminal command `pip install yfinance` and import it into scripts using `import yfinance as yf`."
    source: "Official yfinance documentation hosted on GitHub Pages"
    url: "https://ranaroussi.github.io/yfinance/"
  - text: "Yfinance is an open-source package distributed under the Apache Software License that provides a Pythonic wrapper around Yahoo Finance's publicly available web endpoints."
    source: "Python Package Index (PyPI)"
    url: "https://pypi.org/project/yfinance/"
  - text: "Yfinance is not affiliated, endorsed, or vetted by Yahoo, Inc., and the underlying Yahoo Finance endpoints are restricted to personal, non-commercial research and educational use."
    source: "Python Package Index (PyPI)"
    url: "https://pypi.org/project/yfinance/"
---

You can use yfinance in Python by installing the open-source library (free code shared publicly). Next, you import it to request financial figures from public [Yahoo Finance](https://finance.yahoo.com/) endpoints (web addresses where software sends data requests).

A developer writes simple ticker commands to download decades of stock prices, balance sheet metrics, and live quotes. Downloaded records load directly into data frames (two-dimensional tables of rows and columns). The tool bridges basic programming environments with financial market data for personal testing and analysis.

## How do you install and set up yfinance?
You install yfinance by typing `pip install yfinance` into your terminal, then import it with `import yfinance as yf`.

The official yfinance documentation on GitHub Pages notes that it installs directly from the [Python](https://www.python.org/) Package Index. Users run the pip command in their command line shell or inside a virtual environment. This simple setup avoids complex manual API key (unique digital access codes used to authenticate data requests) registrations or paid subscription accounts.

The Python Package Index lists yfinance as an open-source package under the Apache Software License. Developers standardise on the abbreviation `yf` to keep their script commands short and readable.

Isolating dependencies (supporting code libraries) prevents version conflicts from corrupting other tools on your machine. When developers build automated tools for [financial data analysis](/video/how-python-powers-wall-street-beyond-basic-financial-data-analysis), dedicated virtual environments protect system stability across updates.

Keeping software environments cleanly separated is just sound practice whenever you build digital tools. I am not a trained programmer myself, but creating isolated spaces prevents unexpected package collisions that disrupt the whole system. Taking an extra minute to lock down your configuration upfront prevents unneeded headaches later.

You can test your installation immediately by running a single verification line in your Python console. Checking the installed package version confirms that network firewalls allow external package downloads. Once the import command completes without producing an error message, your local machine can query external financial endpoints.

## Download historical stock prices for single and multiple tickers
You download historical stock prices with the download function. You pass it a ticker list, or query the history method on a Ticker object.

The official yfinance documentation on GitHub Pages explains that market queries default to dividend-adjusted values. This happens through the auto_adjust=True setting. It automatically recalculates historical open, high, low, and closing values. These updates account for share splits and cash distributions. Adjusted numbers give analysts an accurate view of total returns over multi-year horizons.

If you need unadjusted historical figures, set auto_adjust=False in your download query. Leaving out recalculations preserves the raw closing price printed on the exchange tape during that session. You might model backtested (simulated against historical data) investment growth. Or you might examine historical option strikes (the set prices at which options contracts can be exercised).

Downloading records for dozens of securities requires passing a symbol list into a single batch function. The library arranges downloaded data into multi-level tables. These tables contain daily open, high, low, close, and volume columns. You can define calendar ranges with start and end date strings formatted in year-month-day order.

- Specify the target ticker symbols as text strings.
- Set custom calendar dates to restrict the historical evaluation window.
- Configure the auto adjust parameter to select raw or dividend-adjusted market prices.
- Run the download call to load structured trading rows into your workspace.

An analyst can calculate moving averages (average prices over specific time windows). They can backtest momentum filters (rules that trade based on price trends tested on historical data). They can also measure drawdowns (peak-to-trough investment losses) across market crashes with five lines of code.

Trading traditional stocks taught me that staring at raw ticker swings often clouds objective judgment. Having straightforward price histories laid out neatly lets you evaluate long-term trends calmly rather than reacting to daily market noise.

## What company fundamentals and financials can you extract?
You extract company fundamentals by creating a Ticker instance. Then, query its built-in properties for balance sheets, cash flows, and corporate actions. Calling balance sheet, income statement, or cashflow returns multi-period financial tables. These tables show revenue trends, operating expenses, asset valuations, and debt levels over consecutive quarters.

The official yfinance documentation on GitHub Pages notes that the library includes Screener and EquityQuery classes. These search classes scan hundreds of equities (company stocks). Developers can filter them by market capitalization (the total market value of a company's shares). They can also filter by valuation ratios (metrics comparing share prices to financial performance).

The Python Package Index describes yfinance as a wrapper around Yahoo Finance's public web endpoints. The underlying endpoints are restricted to personal, non-commercial research and educational use. yfinance is not affiliated, endorsed, or vetted by Yahoo, Inc.

According to the official documentation, the library also provides WebSocket and AsyncWebSocket classes for live streaming. These programming tools create continuous connections for live data transfer. Applications receive live market quotes rather than waiting on delayed page scrapes. When evaluating valuation metrics alongside [alternative data APIs](/video/the-algorithmic-edge-deconstructing-the-apis-powering-modern), fundamental indicators confirm operational health.

- Multi-year financial statements, including balance sheets and cash flow disclosures.
- Live market quote streams through dedicated WebSocket and AsyncWebSocket modules.
- Insider trade reports and major institutional shareholder ownership stakes.
- Security screening tools that sort equities across market sectors and industries.

Accessing fundamental tables in code helps analysts build automated scoring models. You can compare price-to-earnings metrics (ratios comparing share price to earnings per share) across rivals. This comparison runs inside a single execution loop (a programming routine that automatically repeats tasks across a list).

## Legal restrictions and technical limits of Yahoo Finance data
Using yfinance carries strict non-commercial terms and lacks official customer support. It also faces constant risks of rate limits or service disruptions.

Commercial software products and paid quantitative hedge funds cannot legally deploy this library as their core market feed.

Because yfinance parses publicly accessible web endpoints, any layout or backend change made by Yahoo can break the library instantly. Developers frequently experience temporary parsing failures when website architects alter internal table formats.

Relying on scraped public channels is always a fragile route because web architectures shift constantly without prior warning. Whenever I build automated helpers, I treat external feeds cautiously and cross-check the underlying numbers elsewhere.

Frequent querying from an automated script will trigger rate limits from host servers. Sending hundreds of rapid requests causes Yahoo servers to return empty data or block your IP address temporarily.

Responsible coders add delays between successive ticker queries and cache downloaded data to local disk storage. If your system requires guaranteed uptime and microsecond execution, you must pay for a licensed commercial market data provider.

## Vincent Codes Finance demonstrates uv setup and historical price downloads
YouTube creator [Vincent Codes Finance](https://vincent.codes.finance/) demonstrates project environment creation with uv. Vincent introduces himself as a finance professor at HEC Montréal. He has spent 10 years using Python for financial data analysis. Instead of relying on standard pip, Vincent uses the uv tool to initialize his project environment with uv init.

Vincent shows that Yahoo Finance provides intraday pricing down to a 1-minute frequency. According to [Vincent Codes Finance](https://github.com/Vincent-Codes-Finance), Yahoo limits these 1-minute intraday queries to a week at a time. He adds that the history only goes back 30 days.

Vincent Codes Finance also shows how to inspect mutual funds and ETFs using the SPY ETF as his primary example. ETFs are exchange-traded funds, which hold collections of assets and trade on stock exchanges like individual shares. Vincent Codes Finance notes that [Apple](https://www.apple.com/) makes up almost 7% of assets under management in the SPY ETF. When inspecting institutional ownership for Apple, he points out that Vanguard Group holds almost 10% of the company's shares.

## Sources

- [yfinance documentation &#8212; yfinance](https://ranaroussi.github.io/yfinance/) — github.io
- [yfinance · PyPI](https://pypi.org/project/yfinance/) — pypi.org
- [GitHub - ranaroussi/yfinance: Download market data from Yahoo! Finance's API · GitHub](https://github.com/ranaroussi/yfinance) — github.com
- [Scrape Financial Data from Yahoo! Finance with Python](https://www.youtube.com/watch?v=oWmWFGP9lOg) — Vincent Codes Finance on YouTube
