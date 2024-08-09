// ==UserScript==
// @name         GGn User Stats Tracker
// @namespace    https://gazellegames.net/
// @version      1.3.2
// @description  Show a graph of your user and community stats on your profile
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
// @require      https://unpkg.com/js-datepicker@5.18.2/dist/datepicker.min.js
// ==/UserScript==

const syncTrackingStartDate = async () => {
  const statsTrackingSynced =
    (await GM.getValue("statsTrackingSynced")) || false;

  if (statsTrackingSynced === true) {
    return;
  }

  const userStats = (await GM.getValue("userStats")) || {};
  const communityStats = (await GM.getValue("communityStats")) || {};

  const userStatsStartDate = Object.keys(userStats)[0];
  const communityStatsStartDate = Object.keys(communityStats)[0];

  const parsedUserStatsStartDate = new Date(userStatsStartDate);
  const parsedCommunityStatsStartDate = new Date(communityStatsStartDate);

  if (parsedCommunityStatsStartDate > parsedUserStatsStartDate) {
    for (let key in userStats) {
      if (new Date(key) < parsedCommunityStatsStartDate) {
        delete userStats[key];
      }
    }
  }

  await GM.setValue("userStats", userStats);
  await GM.setValue("statsTrackingSynced", true);
};

syncTrackingStartDate();

const loadCSS = (url) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = url;
  document.head.appendChild(link);
};

// Load datepicker CSS
loadCSS("https://unpkg.com/js-datepicker/dist/datepicker.min.css");

Chart.defaults.color = "#FFF";
Chart.defaults.borderColor = "rgba(255, 255, 255, 0.05)";
Chart.defaults.font.size = 14;

let userStatsGraph;
let communityStatsGraph;
let savedPreference;

let userStatsCanvas = document.createElement("canvas");
let communityStatsCanvas = document.createElement("canvas");

const currentDate = moment(new Date()).format("YYYY-MM-DD");
let startUserStats;

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
    <p>
      The stats will automatically update once every hour (60 minutes) whenever you use the site.<br>
    You can click on <strong style="color: #36a2eb">each</strong> <strong style="color: #ff6384;">of</strong> <strong style="color: #ff9f40;">the</strong> <strong style="color:#4bc0c0">six</strong> <strong style="color:#9966ff">colored</strong> <strong style="color:#ffcc56">boxes</strong> to toggle the graph.<br>
      Your preference will automatically be saved.
    </p>
    <p>
      You can also use the range picker below to see a certain period.
    </p>

    <div id="userStatsGraph" style="width: 95%; margin: 25px auto 0;"></div>
    <div id="communityStatsGraph" style="width: 95%; margin: 25px auto 0;"></div>
  </div>
</div>`;

  profileBox.insertAdjacentHTML("afterend", userStatsHTML);

  document
    .getElementById("userStatsDiv")
    .querySelector(".head")
    .addEventListener("click", toggleUserStatsDiv);

  return {
    userStatsEl: document.getElementById("userStatsGraph"),
    communityStatsEl: document.getElementById("communityStatsGraph"),
  };
};

const parseTime = (time) => {
  return moment(time)
    .format("DD MMM YYYY - h:mm a z")
    .replace("pm", "p.m")
    .replace("am", "a.m");
};

const getTimeUnit = (length) => {
  if (length > 90) {
    timeUnit = "month";
    minUnit = "month";
  } else if (length > 30) {
    timeUnit = "week";
    minUnit = "week";
  } else {
    timeUnit = "day";
    minUnit = "day";
  }

  return { timeUnit, minUnit };
};

const trackingInfo = (stats) => {
  const period = [];

  for (let key in stats) {
    period.push(key);
  }

  period.sort((a, b) => new Date(a) - new Date(b));

  return {
    display: true,
    text: `Stats tracked since ${moment(period[0]).format("DD MMM YYYY")}`,
    font: {
      size: 13,
      weight: "oblique",
    },
    color: "rgb(201, 203, 207)",
    padding: {
      bottom: 15,
    },
  };
};

const rebuildGraph = () => {
  const startDate = moment(
    new Date(document.getElementById("tracking-startdate").value)
  ).format("YYYY-MM-DD");
  const endDate = moment(
    new Date(document.getElementById("tracking-enddate").value)
  ).format("YYYY-MM-DD");

  userStatsGraph.destroy();
  communityStatsGraph.destroy();

  buildUserStatsGraph(startDate, endDate);
  buildCommunityStatsGraph(startDate, endDate);
};

const buildDatepicker = async () => {
  const trackingRangeDiv = document.createElement("div");
  trackingRangeDiv.style =
    "display: flex; align-items: end; justify-content: center; margin-top: 20px;";

  const startDiv = document.createElement("div");
  startDiv.style = "margin-top: 10px;";

  const startLabel = document.createElement("label");
  startLabel.setAttribute("for", "tracking-startdate");
  startLabel.innerText = "Start Date";
  startLabel.style = "display: block; margin-bottom: 5px;";

  const startDateInput = document.createElement("input");
  startDateInput.id = "tracking-startdate";
  startDateInput.placeholder = " Start";
  startDateInput.value = moment(startUserStats).format("DD MMM YYYY");
  startDateInput.readOnly = true;
  startDateInput.style = "display: block; height: auto; padding: 5px 10px;";

  startDiv.append(startLabel, startDateInput);

  const endDiv = document.createElement("div");
  endDiv.style = "margin: 0 10px;";

  const endLabel = document.createElement("label");
  endLabel.setAttribute("for", "tracking-startdate");
  endLabel.innerText = "End Date";
  endLabel.style = "display: block; margin-bottom: 5px;";

  const endDateInput = document.createElement("input");
  endDateInput.id = "tracking-enddate";
  endDateInput.placeholder = " End";
  endDateInput.value = moment(currentDate).format("DD MMM YYYY");
  endDateInput.readOnly = true;
  endDateInput.style = "display: block; height: auto; padding: 5px 10px;";

  endDiv.append(endLabel, endDateInput);

  const filterButton = document.createElement("button");
  filterButton.id = "tracking-filter";
  filterButton.innerText = "Filter";
  filterButton.type = "button";
  filterButton.style = "display: block; padding: 5px 10px; height: auto;";
  filterButton.onclick = rebuildGraph;

  trackingRangeDiv.append(startDiv, endDiv, filterButton);

  document
    .getElementById("userStatsGraph")
    .insertAdjacentElement("beforebegin", trackingRangeDiv);

  datepicker("#tracking-startdate", {
    id: 1,
    formatter: (input, date) => {
      input.value = moment(date).format("DD MMM YYYY");
    },
    maxDate: new Date(),
    dateSelected: new Date(startUserStats),
    onSelect: (instance, date) => {
      if (date == undefined) {
        instance.setDate(new Date(startUserStats), true);
      }
    },
    minDate: startUserStats,
  });

  datepicker("#tracking-enddate", {
    id: 1,
    formatter: (input, date) => {
      input.value = moment(date).format("DD MMM YYYY");
    },
    maxDate: new Date(),
    dateSelected: new Date(),
    onSelect: (instance, date) => {
      if (date == undefined) {
        instance.setDate(new Date(), true);
      }
    },
  });
};

const buildUserStatsGraph = async (
  start = moment(startUserStats).format("YYYY-MM-DD"),
  end = currentDate
) => {
  const stats = Object.fromEntries(
    Object.entries(await GM.getValue("userStats")).filter(
      ([date, _]) => date >= start && date <= end
    )
  );

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
    if (stats[date]["uploaded"] === null) stats[date]["uploaded"] = 0;
    if (stats[date]["downloaded"] === null) stats[date]["downloaded"] = 0;
    if (stats[date]["gold"] === null) starts[date]["gold"] = 0;

    uploaded.push(stats[date]["uploaded"]);
    downloaded.push(stats[date]["downloaded"]);
    gold.push(stats[date]["gold"]);
  });

  const { timeUnit, minUnit } = getTimeUnit(period.length);

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

  const defaultYAxis = savedPreference["Gold"] ? trafficAxis : goldAxis;

  userStatsGraph = new Chart(userStatsCanvas, {
    data: {
      datasets: [
        {
          type: "line",
          label: "Upload",
          data: uploaded,
          hidden: savedPreference["Upload"],
        },
        {
          type: "line",
          label: "Download",
          data: downloaded,
          hidden: savedPreference["Download"],
        },
        {
          type: "line",
          label: "Gold",
          data: gold,
          hidden: savedPreference["Gold"],
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
        subtitle: trackingInfo(await GM.getValue("userStats")),
        legend: {
          onClick: async (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            toggleChart(index, legend.chart);
            legend.chart.update();

            const legends = legend.chart.legend.legendItems;
            const userPref = (await GM.getValue("userPref")) || {};

            legends.forEach((item) => {
              userPref[item.text] = item.hidden;
            });

            await GM.setValue("userPref", { ...savedPreference, ...userPref });
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
        },
        y: defaultYAxis,
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
};

const buildCommunityStatsGraph = async (
  start = moment(startUserStats).format("YYYY-MM-DD"),
  end = currentDate
) => {
  const lastUpdated = await GM.getValue("lastApiTimestamp");

  const stats = Object.fromEntries(
    Object.entries(await GM.getValue("communityStats")).filter(
      ([date, _]) => date >= start && date <= end
    )
  );

  const period = [];
  const lines = [];
  const posts = [];
  const uploads = [];

  for (let key in stats) {
    period.push(key);
  }

  period.sort((a, b) => new Date(a) - new Date(b));

  period.forEach((date) => {
    if (stats[date]["lines"] === null) stats[date]["lines"] = 0;
    if (stats[date]["posts"] === null) stats[date]["posts"] = 0;
    if (stats[date]["uploads"] === null) starts[date]["uploads"] = 0;

    lines.push(stats[date]["lines"]);
    posts.push(stats[date]["posts"]);
    uploads.push(stats[date]["uploads"]);
  });

  const { timeUnit, minUnit } = getTimeUnit(period.length);

  communityStatsGraph = new Chart(communityStatsCanvas, {
    data: {
      datasets: [
        {
          type: "line",
          label: "IRC Lines",
          data: lines,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          hidden: savedPreference["IRC Lines"],
        },
        {
          type: "line",
          label: "Forum Posts",
          data: posts,
          borderColor: "rgb(153, 102, 255)",
          backgroundColor: "rgba(153, 102, 255, 0.5)",
          hidden: savedPreference["Forum Posts"],
        },
        {
          type: "line",
          label: "Torrent Uploads",
          data: uploads,
          borderColor: "rgb(255, 205, 86)",
          backgroundColor: "rgba(255, 205, 86,0.5)",
          hidden: savedPreference["Torrent Uploads"],
        },
      ],
      labels: period,
    },
    options: {
      plugins: {
        legend: {
          onClick: async (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const { chart, legendItems } = legend;

            if (chart.isDatasetVisible(index)) {
              chart.hide(index);
              legendItem.hidden = true;
            } else {
              legendItems.forEach((val, legendIndex) => {
                if (index != legendIndex) {
                  chart.hide(legendIndex);
                }
              });
              chart.show(index);
              legendItem.hidden = false;
            }

            const legends = legend.chart.legend.legendItems;
            const userPref = (await GM.getValue("userPref")) || {};

            legends.forEach((item) => {
              userPref[item.text] = item.hidden;
            });

            await GM.setValue("userPref", { ...savedPreference, ...userPref });
          },
        },
        tooltip: {
          boxPadding: 5,
          callbacks: {
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
        },
        y: {
          ticks: {
            padding: 15,
          },
          title: {
            display: true,
            text: "Count",
            font: {
              size: 15,
            },
          },
        },
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
};

const defaultPref = {
  Upload: true,
  Download: true,
  Gold: false,
  "IRC Lines": false,
  "Forum Posts": true,
  "Torrent Uploads": true,
};

(async function () {
  "use strict";

  let apiKey = await GM.getValue("apiKey");
  savedPreference = (await GM.getValue("userPref")) || defaultPref;

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
    let userId = (await GM.getValue("userId")) || null;

    // Just do the API call once every hour
    const apiLimitInSeconds = 3600;

    const endpoint = "https://gazellegames.net/api.php";
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

    if (!userId) {
      const getUserId = await fetch(`${endpoint}?request=quick_user`, options);
      if (getUserId.status === 401) {
        GM.deleteValue("apiKey");
        noty({
          type: "warning",
          text: "Invalid API key. Please refresh the page and enter a new one.",
        });
        return;
      }
      const { response } = await getUserId.json();
      GM.setValue("userId", response.id);
      userId = response.id;
    }

    const apiCall = await fetch(
      `${endpoint}?request=user&id=${userId}`,
      options
    );

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
    const currentUserStats = {};
    const currentCommunityStats = {};

    const { stats, community } = response;

    const currentTime = moment(new Date()).format("DD MMM YYYY HH:mm");

    currentUserStats[currentDate] = {};
    currentUserStats[currentDate]["uploaded"] = stats.uploaded;
    currentUserStats[currentDate]["downloaded"] = stats.downloaded;
    currentUserStats[currentDate]["last_updated"] = currentTime;

    currentCommunityStats[currentDate] = {};
    currentCommunityStats[currentDate]["lines"] = community.ircLines;
    currentCommunityStats[currentDate]["posts"] = community.posts;
    currentCommunityStats[currentDate]["uploads"] = community.uploaded;
    currentCommunityStats[currentDate]["last_updated"] = currentTime;

    const currentGold = parseInt(
      document
        .getElementById("stats_gold")
        .querySelector(".tooltip")
        .textContent.replace(/,/g, "")
    );
    currentUserStats[currentDate]["gold"] = currentGold;

    const existingUserStats = (await GM.getValue("userStats")) || {};
    const existingCommunityStats = (await GM.getValue("communityStats")) || {};

    existingUserStats[currentDate] = currentUserStats[currentDate];
    existingCommunityStats[currentDate] = currentCommunityStats[currentDate];

    await GM.setValue("userStats", existingUserStats);
    await GM.setValue("communityStats", existingCommunityStats);
  };

  const response = await getUserData();
  if (response) await trackData(response);

  if (isMyProfile()) {
    const { userStatsEl, communityStatsEl } = createUserStatsBox();

    startUserStats = new Date(Object.keys(await GM.getValue("userStats"))[0]);

    buildDatepicker();

    buildUserStatsGraph();
    userStatsEl.appendChild(userStatsCanvas);

    buildCommunityStatsGraph();
    communityStatsEl.appendChild(communityStatsCanvas);

    window.addEventListener("resize", function () {
      userStatsGraph.resize();
      communityStatsGraph.resize();
    });
  }
})();
