# Twelve Data API - CIK and CUSIP Analysis

## Current Usage in Codebase

The codebase currently uses the following Twelve Data API endpoints:

1. **`/quote`** - Used in `app/api/stocks/indices/route.ts`
   - Returns real-time stock quotes
   - Does NOT return CIK or CUSIP

2. **`/time_series`** - Used in `app/api/stocks/charts-data/route.ts`
   - Returns historical price data
   - Does NOT return CIK or CUSIP

## Endpoints That Return CUSIP

The following Twelve Data API endpoints **explicitly return CUSIP** in their response data:

### 1. `/stocks` (Asset Catalog)
- **Purpose**: Search and list stocks
- **Parameters**: 
  - `symbol` (string, optional)
  - `cusip` (string, optional) - Can be used as a filter
  - `cik` (string, optional) - Can be used as a filter
- **Returns**: 
  - `cusip` field in the response `data` array
  - Example: `"cusip": "037833100"`
- **Response Structure**:
  ```json
  {
    "data": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc",
        "currency": "USD",
        "exchange": "NASDAQ",
        "mic_code": "XNGS",
        "country": "United States",
        "type": "Common Stock",
        "figi_code": "BBG000B9Y5X2",
        "cfi_code": "ESVUFR",
        "isin": "US0378331005",
        "cusip": "037833100",
        "access": { "global": "Basic", "plan": "Basic" }
      }
    ],
    "status": "ok"
  }
  ```

### 2. `/etfs` (ETF Catalog)
- **Purpose**: Search and list ETFs
- **Parameters**: 
  - `symbol` (string, optional)
  - `cusip` (string, optional) - Can be used as a filter
  - `cik` (string, optional) - Can be used as a filter
- **Returns**: 
  - `cusip` field in the response `data` array
  - Example: `"cusip": "037833100"`
- **Response Structure**:
  ```json
  {
    "data": [
      {
        "symbol": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "currency": "USD",
        "exchange": "NYSE",
        "mic_code": "ARCX",
        "country": "United States",
        "figi_code": "BBG000BDTF76",
        "cfi_code": "CECILU",
        "isin": "US78462F1030",
        "cusip": "037833100",
        "access": { "global": "Basic", "plan": "Basic" }
      }
    ],
    "status": "ok"
  }
  ```

### 3. `/funds` (Mutual Funds Catalog)
- **Purpose**: Search and list mutual funds
- **Parameters**: 
  - `symbol` (string, optional)
  - `cusip` (string, optional) - Can be used as a filter
  - `cik` (string, optional) - Can be used as a filter
- **Returns**: 
  - `cusip` field in the response `result.list` array
  - Example: `"cusip": "35473P108"`
- **Response Structure**:
  ```json
  {
    "result": {
      "count": 84799,
      "list": [
        {
          "symbol": "DIVI",
          "name": "AdvisorShares Athena High Dividend ETF",
          "country": "United States",
          "currency": "USD",
          "exchange": "NYSE",
          "mic_code": "ARCX",
          "type": "ETF",
          "figi_code": "BBG00161BCW4",
          "cfi_code": "CECILU",
          "isin": "GB00B65TLW28",
          "cusip": "35473P108",
          "access": { "global": "Basic", "plan": "Basic" }
        }
      ]
    },
    "status": "ok"
  }
  ```

## Endpoints That Accept CIK as Input Parameter

The following endpoints accept `cik` as a **query parameter** (for filtering/searching), but **do not explicitly show CIK in their response examples**:

### Asset Catalog Endpoints
- `/stocks` - Accepts `cik` parameter
- `/etfs` - Accepts `cik` parameter
- `/funds` - Accepts `cik` parameter
- `/etfs/list` - Accepts `cik` parameter
- `/mutual_funds/list` - Accepts `cik` parameter

### Regulatory/EDGAR Endpoints
These endpoints are designed to work with CIK values and may return CIK-related data:
- `/edgar-filings-archive` - Accepts `cik` parameter
- `/insider-transactions` - Accepts `cik` parameter
- `/institutional-holders` - Accepts `cik` parameter
- `/fund-holders` - Accepts `cik` parameter
- `/direct-holders` - Accepts `cik` parameter

**Note**: While these endpoints accept CIK as input, the documentation examples do not explicitly show CIK as a returned field in the response payload. The data returned would be related to the CIK used in the request, but CIK itself may not be included as a separate field.

## Endpoints That Accept CUSIP as Input Parameter

Many endpoints accept `cusip` as a **query parameter** for filtering/searching, but do not explicitly show CUSIP in their response examples:

### Market Data Endpoints
- `/time_series` - Accepts `cusip` parameter
- `/quote` - Accepts `cusip` parameter
- `/price` - Accepts `cusip` parameter
- `/eod` - Accepts `cusip` parameter

### Company Information Endpoints
- `/profile` - Accepts `cusip` parameter
- `/dividends` - Accepts `cusip` parameter
- `/dividends_calendar` - Accepts `cusip` parameter
- `/splits` - Accepts `cusip` parameter
- `/splits_calendar` - Accepts `cusip` parameter
- `/earnings` - Accepts `cusip` parameter
- `/earnings_estimate` - Accepts `cusip` parameter
- `/revenue_estimate` - Accepts `cusip` parameter
- `/eps_trend` - Accepts `cusip` parameter
- `/eps_revisions` - Accepts `cusip` parameter
- `/growth_estimates` - Accepts `cusip` parameter
- `/recommendations` - Accepts `cusip` parameter
- `/price_target` - Accepts `cusip` parameter
- `/analyst_ratings/light` - Accepts `cusip` parameter
- `/market_cap` - Accepts `cusip` parameter

### ETF/Mutual Fund Endpoints
- `/etfs/list` - Accepts `cusip` parameter
- `/etfs/world` - Accepts `cusip` parameter
- `/etfs/world/summary` - Accepts `cusip` parameter
- `/etfs/world/performance` - Accepts `cusip` parameter
- `/etfs/world/risk` - Accepts `cusip` parameter
- `/etfs/world/composition` - Accepts `cusip` parameter
- `/mutual_funds/list` - Accepts `cusip` parameter
- `/mutual_funds/world` - Accepts `cusip` parameter
- `/mutual_funds/world/summary` - Accepts `cusip` parameter
- `/mutual_funds/world/performance` - Accepts `cusip` parameter
- `/mutual_funds/world/risk` - Accepts `cusip` parameter
- `/mutual_funds/world/ratings` - Accepts `cusip` parameter
- `/mutual_funds/world/composition` - Accepts `cusip` parameter
- `/mutual_funds/world/purchase_info` - Accepts `cusip` parameter
- `/mutual_funds/world/sustainability` - Accepts `cusip` parameter

### Technical Indicators
All technical indicator endpoints accept `cusip` as a parameter:
- `/bbands`, `/dema`, `/ema`, `/ht_trendline`, `/ichimoku`, `/kama`, `/keltner`, `/ma`, `/mama`, `/mcginley_dynamic`, `/midpoint`, `/midprice`, `/pivot_points_hl`, `/sar`, `/sarext`, `/sma`, `/t3ma`, `/tema`, `/trima`, `/vwap`, `/wma`
- `/adx`, `/adxr`, `/apo`, `/aroon`, `/aroonosc`, `/bop`, `/cci`, `/cmo`, `/coppock`, `/crsi`, `/dpo`, `/dx`, `/kst`, `/macd`, `/macd_slope`, `/macdext`, `/mfi`, `/minus_di`, `/minus_dm`, `/mom`, `/percent_b`, `/plus_di`, `/plus_dm`, `/ppo`, `/roc`, `/rocp`, `/rocr`, `/rocr100`, `/rsi`, `/stoch`, `/stochf`, `/stochrsi`, `/ultosc`, `/willr`
- `/ad`, `/adosc`, `/obv`, `/rvol`, `/atr`, `/natr`, `/supertrend`, `/supertrend_heikinashicandles`, `/trange`
- `/add`, `/avg`, `/avgprice`, `/ceil`, `/div`, `/exp`, `/floor`, `/heikinashicandles`, `/hlc3`, `/ln`, `/log10`, `/medprice`, `/mult`, `/sqrt`, `/sub`, `/sum`, `/typprice`, `/wclprice`
- `/ht_dcperiod`, `/ht_dcphase`, `/ht_phasor`, `/ht_sine`, `/ht_trendmode`
- `/beta`, `/correl`, `/linearreg`, `/linearregangle`, `/linearregintercept`, `/linearregslope`, `/max`, `/maxindex`, `/min`, `/minindex`, `/minmax`, `/minmaxindex`, `/stddev`, `/tsf`, `/var`

## Summary

### Endpoints That Return CUSIP:
1. ✅ `/stocks` - Returns `cusip` in `data` array
2. ✅ `/etfs` - Returns `cusip` in `data` array
3. ✅ `/funds` - Returns `cusip` in `result.list` array

### Endpoints That Accept CIK as Input:
- Multiple asset catalog endpoints (`/stocks`, `/etfs`, `/funds`, etc.)
- Regulatory/EDGAR endpoints (`/edgar-filings-archive`, `/insider-transactions`, `/institutional-holders`, etc.)
- **Note**: CIK is primarily used as an input parameter for filtering/searching, but is not explicitly shown as a returned field in documentation examples.

### Endpoints That Accept CUSIP as Input:
- Most market data, company information, ETF/mutual fund, and technical indicator endpoints accept `cusip` as a parameter for filtering/searching.
- However, only the three catalog endpoints (`/stocks`, `/etfs`, `/funds`) explicitly return CUSIP in their responses.

## Recommendations

If you need to retrieve CIK or CUSIP for a stock symbol:

1. **For CUSIP**: Use the `/stocks` endpoint with the `symbol` parameter:
   ```
   GET https://api.twelvedata.com/stocks?symbol=AAPL&apikey=YOUR_API_KEY
   ```
   This will return the CUSIP in the response.

2. **For CIK**: The Twelve Data API documentation does not explicitly show CIK as a returned field. You may need to:
   - Use the `/stocks` endpoint with `cik` as a filter parameter (if you already have the CIK)
   - Consider using alternative data sources (like SEC API) for CIK lookup
   - Check if the `/profile` or other company information endpoints return CIK (not shown in standard documentation)

3. **Alternative Approach**: If you need CIK for a stock, you might need to use a different API (like SEC API) or a mapping service that provides symbol-to-CIK conversion.
