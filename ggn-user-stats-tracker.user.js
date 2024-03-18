// ==UserScript==
// @name         GGn User Stats Tracker
// @namespace    https://gazellegames.net/
// @version      1.1.3
// @description  Show a graph of your traffic or gold stats on your profile
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-user-stats-tracker.user.js
// @match        https://gazellegames.net/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js
// ==/UserScript==

const currentDate = moment(new Date()).format("YYYY-MM-DD");
let userGraph;

const bytesIn = (target) => {
  let exponent = 1;

  if (target == "PB") exponent = 5;
  else if (target == "TB") exponent = 4;
  else if (target == "GB") exponent = 3;
  else if (target == "MB") exponent = 2;

  return Math.pow(1024, exponent);
};

const convertTo = (bytes, target) => {
  const getBytes = bytesIn(target);
  return Math.floor(bytes / getBytes) + ` ${target}`;
};

const parseBytes = (value) => {
  if (value >= bytesIn("TB")) {
    return (value / bytesIn("TB")).toFixed(1) + " TB";
  } else if (value >= bytesIn("GB")) {
    return (value / bytesIn("GB")).toFixed(1) + " GB";
  } else if (value >= bytesIn("MB")) {
    return (value / bytesIn("MB")).toFixed(1) + " MB";
  } else {
    return value.toFixed(1) + " Bytes";
  }
};

const isMyProfile = () => {
  const welcomeInfo = document.getElementById("userinfo_username");
  const welcomeUsername = welcomeInfo.querySelector(".username").textContent;

  const profile = document.querySelector(".profile");

  if (profile) {
    const profileUsername = profile.querySelector(".username").textContent;
    return welcomeUsername === profileUsername;
  }
  return false;
};

const toggleUserStatsDiv = () => {
  const userStats = document.getElementById("userStats");

  if (userStats.style.display === "none") {
    userStats.style.display = "block";
  } else {
    userStats.style.display = "none";
  }
};

const createUserStatsBox = () => {
  const profileBox = document.querySelector(".box_info");
  const userStatsHTML = `
<div class="box" id="userStatsDiv">
  <div class="head tooltip">
    <span style="float:left;"><strong>User Stats</strong></span>
  </div>
  <div class="pad" id="userStats">
    <p>The stats will automatically update once every minute (60 seconds) whenever you use the site.<br>
    You can click on <strong style="color: #36a2eb">Uploaded</strong>, <strong style="color: #ff6384;">Downloaded</strong> or <strong style="color: #ff9f40;">Gold</strong> to toggle the graph.</p>
    <div id="userGraph" style="width: 95%; margin: 25px auto 0;"></div>
  </div>
</div>`;

  profileBox.insertAdjacentHTML("afterend", userStatsHTML);

  document
    .getElementById("userStatsDiv")
    .querySelector(".head")
    .addEventListener("click", toggleUserStatsDiv);

  return document.getElementById("userGraph");
};

const parseTime = (time) => {
  return moment(time)
    .format("DD MMM YYYY - h:mm a z")
    .replace("pm", "p.m")
    .replace("am", "a.m");
};

const buildGraph = async (el) => {
  const canvas = document.createElement("canvas");

  const stats = await GM.getValue("userStats");
  const lastUpdated = await GM.getValue("lastApiTimestamp");

  const period = [];
  const uploaded = [];
  const downloaded = [];
  const gold = [];

  for (let key in stats) {
    period.push(key);
  }

  period.sort((a, b) => new Date(a) - new Date(b));

  period.forEach((date) => {
    uploaded.push(stats[date]["uploaded"]);
    downloaded.push(stats[date]["downloaded"]);
    gold.push(stats[date]["gold"]);
  });

  let timeUnit, minUnit;

  if (period.length > 90) {
    timeUnit = "month";
    minUnit = "month";
  } else if (period.length > 30) {
    timeUnit = "week";
    minUnit = "week";
  } else {
    timeUnit = "day";
    minUnit = "day";
  }

  Chart.defaults.color = "#FFF";
  Chart.defaults.borderColor = "rgba(255, 255, 255, 0.05)";
  Chart.defaults.font.size = 14;

  const goldAxis = {
    title: {
      display: true,
      text: "Gold",
      font: {
        size: 15,
      },
    },
    ticks: {
      padding: 15,
    },
  };

  const trafficAxis = {
    title: {
      display: true,
      text: "Traffic",
      font: {
        size: 15,
      },
    },
    ticks: {
      padding: 15,
      callback: function (value) {
        return parseBytes(value);
      },
    },
  };

  const toggleChart = (index, chart) => {
    if (index === 2) {
      if (chart.isDatasetVisible(2)) {
        chart.hide(2); // Hide Gold
      } else {
        // Show Gold
        chart.show(2);

        // Hide Traffic
        chart.hide(0);
        chart.hide(1);

        chart.options.scales.y = goldAxis;
      }
    } else {
      if (chart.isDatasetVisible(index)) {
        chart.hide(index); // Hide Traffic
      } else {
        // Show Traffic
        chart.show(index);

        // Hide Gold
        chart.hide(2);
        chart.options.scales.y = trafficAxis;
      }
    }
  };

  userGraph = new Chart(canvas, {
    data: {
      datasets: [
        {
          type: "line",
          label: "Uploaded",
          data: uploaded,
        },
        {
          type: "line",
          label: "Downloaded",
          data: downloaded,
        },
        {
          type: "line",
          label: "Gold",
          data: gold,
          hidden: true,
        },
      ],
      labels: period,
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Last Updated: ${parseTime(lastUpdated * 1000)}`,
        },
        legend: {
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            toggleChart(index, legend.chart);
            legend.chart.update();
          },
        },
        tooltip: {
          boxPadding: 5,
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex < 2) return parseBytes(ctx.parsed.y);
              else return ctx.formattedValue;
            },
            title: (ctx) => {
              const day = moment(ctx[0].parsed.x).format("YYYY-MM-DD");
              return parseTime(new Date(stats[day]["last_updated"]).getTime());
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            padding: 15,
            maxTicksLimit: 6,
          },
          type: "time",
          time: {
            unit: timeUnit,
            minUnit: minUnit,
            parser: "yyyy-MM-dd",
            displayFormats: {
              day: "dd MMM yyyy",
              week: "dd MMM yyyy",
            },
          },
          title: {
            display: true,
            text: "Date",
            font: {
              size: 15,
            },
          },
        },
        y: trafficAxis,
      },
    },
    plugins: [
      {
        beforeInit: function (chart) {
          const originalFit = chart.legend.fit;
          chart.legend.fit = function fit() {
            originalFit.bind(chart.legend)();
            this.height += 25;
          };
        },
      },
    ],
  });

  el.appendChild(canvas);
};

(async function () {
  "use strict";

  let apiKey = await GM.getValue("apiKey");

  if (!apiKey) {
    if (
      !(apiKey = prompt(
        "Please enter an API key with the 'User' permission to use this script."
      )?.trim())
    ) {
      return;
    }
    GM.setValue("apiKey", apiKey);
  }

  const getUserData = async () => {
    const now = Date.now() / 1000;
    const lastApiTimestamp = await GM.getValue("lastApiTimestamp");

    // Just do the API call once every minute
    const apiLimitInSeconds = 60;

    const endpoint =
      "https://gazellegames.net/api.php?request=user_stats_ratio";
    const options = {
      method: "GET",
      mode: "same-origin",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      headers: {
        "X-API-Key": apiKey,
      },
    };

    if (now - lastApiTimestamp < apiLimitInSeconds) {
      return;
    }

    const apiCall = await fetch(endpoint, options);

    if (apiCall.status === 401) {
      GM.deleteValue("apiKey");
      noty({
        type: "warning",
        text: "Invalid API key. Please refresh the page and enter a new one.",
      });
      return;
    }

    GM.setValue("lastApiTimestamp", Date.now() / 1000);

    const { response } = await apiCall.json();
    return response;
  };

  const trackData = async (response) => {
    const currentStats = {};

    currentStats[currentDate] = {};
    currentStats[currentDate]["uploaded"] = response.uploaded;
    currentStats[currentDate]["downloaded"] = response.downloaded;
    currentStats[currentDate]["last_updated"] = moment(new Date()).format(
      "DD MMM YYYY HH:mm"
    );

    const currentGold = parseInt(
      document
        .getElementById("stats_gold")
        .querySelector(".tooltip")
        .textContent.replace(/,/g, "")
    );
    currentStats[currentDate]["gold"] = currentGold;

    const existingStats = (await GM.getValue("userStats")) || {};

    existingStats[currentDate] = currentStats[currentDate];

    await GM.setValue("userStats", existingStats);
  };

  const response = await getUserData();
  if (response) await trackData(response);

  if (isMyProfile()) {
    const userGraphCanvas = createUserStatsBox();
    buildGraph(userGraphCanvas);

    window.addEventListener("resize", function () {
      userGraph.resize();
    });
  }
})();
