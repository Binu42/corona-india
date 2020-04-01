var width = window.innerWidth * 0.99, height = window.innerHeight;

var projection = d3.geoMercator();

var path = d3.geoPath()
  .projection(projection)
  .pointRadius(2);

var svg = d3.select("#map").append("svg")
  .attr("width", width)
  .attr("height", height);

var g = svg.append("g"),
  tooltip = d3
    .select("#map")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 1),
  casesByState = {};
d3.json("https://raw.githubusercontent.com/Binu42/corona-india/master/map.json", function (error, data) {
  // console.log(data)
  var boundary = centerZoom(data);
  var subunits = drawSubUnits(data);
  colorSubunits(subunits);
  drawSubUnitLabels(data);
  drawPlaces(data);
  drawOuterBoundary(data, boundary);

});

function centerZoom(data) {

  var o = topojson.mesh(data, data.objects.polygons, function (a, b) { return a === b; });

  projection
    .scale(1)
    .translate([0, 0]);

  var b = path.bounds(o),
    s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
    t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

  var p = projection
    .scale(s)
    .translate(t);

  return o;

}

function drawOuterBoundary(data, boundary) {

  g.append("path")
    .datum(boundary)
    .attr("d", path)
    .attr("class", "subunit-boundary")
    .attr("fill", "none")
    .attr("stroke", "#3a403d");

}

function drawPlaces(data) {

  g.append("path")
    .datum(topojson.feature(data, data.objects.places))
    .attr("d", path)
    .attr("class", "place");

  // g.selectAll(".place-label")
  //   .data(topojson.feature(data, data.objects.places).features)
  //   .enter().append("text")
  //   .attr("class", "place-label")
  //   .attr("transform", function (d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
  //   .attr("dy", ".35em")
  //   .attr("x", 6)
  //   .attr("text-anchor", "start")
  //   .style("font-size", ".7em")
  //   .style("text-shadow", "0px 0px 2px #fff")
  // .text(function (d) { return d.properties.name; });

}

function drawSubUnits(data) {

  var subunits = g.selectAll(".subunit")
    .data(topojson.feature(data, data.objects.polygons).features)
    .enter().append("path")
    .attr("class", "subunit")
    .attr("d", path)
    .style("stroke", "#fff")
    .style("stroke-width", "1px")
    .on("mouseover", function (t) {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0.9);
    })
    .on("mousemove", function (t) {
      const e = casesByState[t.properties.st_nm];
      tooltip.html(`
      <div>
      <h3 style="text-align: center; font-size: '22px'">${t.properties.st_nm}</h3>
      <table>
      <thead>
        <th>status</th>
        <th>cases</th>
      </thead>
      <tbody>
        <tr>
          <td style="color: yellow">Total</td>
          <td>${e ? e.confirmed : 0}</td>
        </tr>
        <tr>
          <td style="color: #ee1212">Active</td>
          <td>${e ? e.active : 0}</td>
        </tr>
        <tr>
          <td style="color: #ee1212">Death</td>
          <td>${e ? e.deaths : 0}</td>
        </tr>
        <tr>
          <td style="color: green">Recovered</td>
          <td>${e ? e.recovered : 0}</td>
        </tr>
      </tbody>
    </table></div>`)
        .style("top", (event.pageY) + "px")
        .style("left", (event.pageX - 100) + "px");
    })
    .on("mouseout", function (t) {
      tooltip
        .transition()
        .duration(400)
        .style("opacity", 0);
    });
  return subunits;
}

function drawSubUnitLabels(data) {

  g.selectAll(".subunit-label")
    .data(topojson.feature(data, data.objects.polygons).features)
    .enter().append("text")
    .attr("class", "subunit-label")
    .attr("transform", function (d) { return "translate(" + path.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font-size", ".5em")
    .style("text-shadow", "0px 0px 2px #fff")
    .style("text-transform", "uppercase")
    .text(function (d) { return d.properties.st_nm; });

}

function colorSubunits(subunits) {

  var c = d3.scaleOrdinal(d3.schemeCategory20);
  subunits
    .style("fill", function (d, i) { return c(i); })
    .style("opacity", ".6");

}

axios.get("https://api.rootnet.in/covid19-in/unofficial/covid19india.org/statewise")
  .then(data => {
    document.querySelector('.preloader').style.display = 'none';
    document.querySelector('#page').style.display = 'block';
    var stateData = data.data.data.statewise;
    document.getElementById('updated-at').innerHTML = `<h4 style='text-align: center'>Last updatedAt:- ${moment(data.data.data.lastRefreshed).format('Do MMMM YYYY, h:mm:ss')}</h4>`
    stateData = stateData.sort();
    const total = data.data.data.total;
    document.getElementById('india-total-data').innerHTML = `<tr>
    <td>${total.confirmed}</td>
    <td>${total.active}</td>
    <td>${total.recovered}</td>
    <td>${total.deaths}</td>
  </tr>`
    var stateWiseData = '', report = [], stateConfirmed = [], stateDeaths = [], stateRecovered = [];
    stateData.forEach((data, index) => {
      if (index === 0) {
        report.push({ name: data.state, y: Math.round((data.confirmed / total.confirmed) * 100), exploded: true })
      } else {
        report.push({ name: data.state, y: Math.round((data.confirmed / total.confirmed) * 100) })
      }
      if (data.confirmed > 0) {
        casesByState[data.state] = { confirmed: data.confirmed, recovered: data.recovered, deaths: data.deaths, active: data.active }
        stateConfirmed.push({ label: data.state, y: data.confirmed })
        stateDeaths.push({ label: data.state, y: data.deaths })
        stateRecovered.push({ label: data.state, y: data.recovered })
      }

      stateWiseData += `<tr>
      <td>${data.state}</td>
      <td>${data.confirmed}</td>
      <td>${data.active}</td>
      <td>${data.recovered}</td>
      <td>${data.deaths}</td>
    </tr>`
    })
    // console.log(stateWiseData)
    document.getElementById('india-states-cases').innerHTML = stateWiseData;

    // plotting graph for percentage each state contribute in total cases...
    var chart = new CanvasJS.Chart("chartContainer", {
      exportEnabled: true,
      animationEnabled: true,
      title: {
        text: "Covid-19 statewise Patient percentage",
        fontSize: 22
      },
      legend: {
        cursor: "pointer",
        fontSize: 14,
        itemclick: explodePie
      },
      data: [{
        type: "pie",
        showInLegend: false,
        toolTipContent: "{name}: <strong>{y}%</strong>",
        indexLabel: "{name} - {y}%",
        dataPoints: report
      }]
    });
    chart.render();

    console.log(stateConfirmed, stateDeaths, stateRecovered)
    var chart7 = new CanvasJS.Chart("chartContainer7", {
      animationEnabled: true,
      title: {
        text: "COVID-19 State Wise figure",
        fontSize: 20
      },
      axisY: {
        labelFontSize: 14,
      },
      axisX: {
        labelFontSize: 14,
        interval: 1,
        labelAngle: -5,
        labelAutoFit: true
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        itemclick: toggleDataSeries,
        fontSize: 18,
      },
      data: [
        {
          type: "stackedBar",
          name: "confirmed cases",
          showInLegend: "true",
          xValueFormatString: "",
          color: 'blue',
          yValueFormatString: "#,##0",
          dataPoints: stateConfirmed
        },
        {
          type: "stackedBar",
          name: "Deaths cases",
          showInLegend: "true",
          xValueFormatString: "",
          color: 'red',
          yValueFormatString: "#,##0",
          dataPoints: stateDeaths
        },
        {
          type: "stackedBar",
          name: "Recovered cases",
          showInLegend: "true",
          color: 'green',
          xValueFormatString: "",
          yValueFormatString: "#,##0",
          dataPoints: stateRecovered
        }]
    });
    chart7.render();

    function toggleDataSeries(e) {
      if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      }
      else {
        e.dataSeries.visible = true;
      }
      chart7.render();
    }
  })


function explodePie(e) {
  if (typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
  } else {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
  }
  e.chart.render();

}

window.onload = function () {
  axios.get('https://api.rootnet.in/covid19-in/stats/daily')
    .then(response => {
      const newTotalCases = [], newIndianCases = [], newForeignerCases = [], newDeathCases = [], newDischargedCases = [], totalCases = [], totalRecovered = [], totalDeath = [], todayCases = [], DeathCases = [], RecoveredCases = [];
      response.data.data.map((day, index) => {
        // console.log(index)
        if (index !== 0) {
          newTotalCases.push({ x: new Date(day.day), y: day.summary.total - response.data.data[index - 1].summary.total });
          newIndianCases.push({ x: new Date(day.day), y: day.summary.confirmedCasesIndian - response.data.data[index - 1].summary.confirmedCasesIndian + day.summary.confirmedButLocationUnidentified - response.data.data[index - 1].summary.confirmedButLocationUnidentified })
          newForeignerCases.push({ x: new Date(day.day), y: day.summary.confirmedCasesForeign - response.data.data[index - 1].summary.confirmedCasesForeign })
          newDeathCases.push({ x: new Date(day.day), y: day.summary.deaths - response.data.data[index - 1].summary.deaths })
          newDischargedCases.push({ x: new Date(day.day), y: day.summary.discharged - response.data.data[index - 1].summary.discharged })
        } else {
          newTotalCases.push({ x: new Date(day.day), y: day.summary.total });
          newIndianCases.push({ x: new Date(day.day), y: day.summary.confirmedCasesIndian + day.summary.confirmedButLocationUnidentified })
          newForeignerCases.push({ x: new Date(day.day), y: day.summary.confirmedCasesForeign })
          newDeathCases.push({ x: new Date(day.day), y: day.summary.deaths })
          newDischargedCases.push({ x: new Date(day.day), y: day.summary.discharged })
        }
        totalCases.push({ x: new Date(day.day), y: day.summary.total });
        totalRecovered.push({ x: new Date(day.day), y: day.summary.discharged });
        totalDeath.push({ x: new Date(day.day), y: day.summary.deaths })
      })

      const latestReport = response.data.data[response.data.data.length - 1].regional.sort(function (a, b) {
        return b.confirmedCasesIndian - a.confirmedCasesIndian;
      });
      const previousDayReport = response.data.data[response.data.data.length - 2].regional.sort(function (a, b) {
        return b.confirmedCasesIndian - a.confirmedCasesIndian;
      });

      const latestSummary = response.data.data[response.data.data.length - 1].summary;
      const previousDaySummary = response.data.data[response.data.data.length - 2].summary
      document.getElementById('india-today-data').innerHTML = `<tr>
        <td>${latestSummary.total - previousDaySummary.total}</td>
        <td>${latestSummary.discharged - previousDaySummary.discharged}</td>
        <td>${latestSummary.deaths - previousDaySummary.deaths}</td>
      </tr>`
      console.log(latestReport, previousDayReport);
      latestReport.map((state, index) => {
        const prevDayMatch = previousDayReport.find(statePrev => statePrev.loc === state.loc);
        if (index === 0) {
          todayCases.push({ name: state.loc, y: ((state.confirmedCasesIndian + state.confirmedCasesForeign) - (prevDayMatch.confirmedCasesIndian + prevDayMatch.confirmedCasesForeign)), exploded: true });
          DeathCases.push({ name: state.loc, y: state.deaths, exploded: true });
          RecoveredCases.push({ name: state.loc, y: state.discharged, exploded: true });
        } else {
          todayCases.push({ name: state.loc, y: ((state.confirmedCasesIndian + state.confirmedCasesForeign) - (prevDayMatch.confirmedCasesIndian + prevDayMatch.confirmedCasesForeign)) })
          DeathCases.push({ name: state.loc, y: state.deaths });
          RecoveredCases.push({ name: state.loc, y: state.discharged });
        }
      })
      // console.log(todayCases)
      // plotting graph for daily wise total cases....
      var chart = new CanvasJS.Chart("chartContainer1", {
        animationEnabled: true,
        title: {
          text: "Today Newly cases in India",
          fontSize: 22
        },
        axisY: {
          includeZero: false,
          prefix: "",
          minimum: -10,
        },
        toolTip: {
          shared: true
        },
        legend: {
          fontSize: 13
        },
        data: [{
          type: "line",
          showInLegend: true,
          name: "Total new cases",
          yValueFormatString: "#,##0",
          xValueFormatString: "DD MMM YYYY",
          dataPoints: newTotalCases
        },
        {
          type: "line",
          showInLegend: true,
          name: "Indian new Cases",
          yValueFormatString: "#,##0",
          dataPoints: newIndianCases
        },
        {
          type: "line",
          showInLegend: true,
          yValueFormatString: "#,##0",
          name: "Foreigner new cases",
          dataPoints: newForeignerCases
        },
        {
          type: "line",
          showInLegend: true,
          yValueFormatString: "#,##0",
          name: "Deaths",
          dataPoints: newDeathCases
        },
        {
          type: "line",
          showInLegend: true,
          yValueFormatString: "#,##0",
          name: "Discharged persons",
          dataPoints: newDischargedCases
        }
        ]
      });
      chart.render();

      // plotting graph for percentage each state contribute in total cases...
      var chart3 = new CanvasJS.Chart("chartContainer3", {
        exportEnabled: true,
        animationEnabled: true,
        title: {
          text: "Covid-19 Today statewise Report newly confirmed cases observed",
          fontSize: 22
        },
        legend: {
          cursor: "pointer",
          fontSize: 12,
          itemclick: explodePie
        },
        data: [{
          type: "pie",
          showInLegend: false,
          toolTipContent: "{name}: <strong>{y}</strong>",
          indexLabel: "{name} - {y}",
          dataPoints: todayCases
        }]
      });
      chart3.render();

      // plotting graph for percentage each state contribute in total cases...
      var chart5 = new CanvasJS.Chart("chartContainer5", {
        exportEnabled: true,
        animationEnabled: true,
        title: {
          text: "Covid-19 statewise Total Deaths Report",
          fontSize: 20
        },
        legend: {
          cursor: "pointer",
          fontSize: 14,
          itemclick: explodePie
        },
        data: [{
          type: "pie",
          showInLegend: false,
          toolTipContent: "{name}: <strong>{y}</strong>",
          indexLabel: "{name} - {y}",
          dataPoints: DeathCases
        }]
      });
      chart5.render();


      // plotting graph for percentage each state contribute in total cases...
      var chart6 = new CanvasJS.Chart("chartContainer6", {
        exportEnabled: true,
        animationEnabled: true,
        title: {
          text: "Covid-19 statewise Total Recovered Patient Report",
          fontSize: 20
        },
        legend: {
          cursor: "pointer",
          fontSize: 14,
          itemclick: explodePie
        },
        data: [{
          type: "pie",
          showInLegend: false,
          toolTipContent: "{name}: <strong>{y}</strong>",
          indexLabel: "{name} - {y}",
          dataPoints: RecoveredCases
        }]
      });
      chart6.render();

      // plotting graph for total cases....
      var chart2 = new CanvasJS.Chart("chartContainer2", {
        animationEnabled: true,
        title: {
          text: "Total Infected vs. Recovered patients",
          fontSize: 22
        },
        axisY: {
          includeZero: false,
          prefix: ""
        },
        toolTip: {
          shared: true
        },
        legend: {
          fontSize: 13
        },
        data: [{
          type: "splineArea",
          showInLegend: true,
          name: "Total cases",
          yValueFormatString: "#,##0",
          xValueFormatString: "DD MMM YYYY",
          dataPoints: totalCases
        }, {
          type: "splineArea",
          showInLegend: true,
          color: 'lightgreen',
          name: "Total Recovered cases",
          yValueFormatString: "#,##0",
          dataPoints: totalRecovered
        },
        ]
      });
      chart2.render();

      // plotting graph for total cases....
      var chart4 = new CanvasJS.Chart("chartContainer4", {
        animationEnabled: true,
        title: {
          text: "Total Covid-19 patient Death Growth",
          fontSize: 22
        },
        axisY: {
          includeZero: false,
          prefix: ""
        },
        toolTip: {
          shared: true
        },
        legend: {
          fontSize: 13
        },
        data: [
          {
            type: "splineArea",
            showInLegend: true,
            name: "Total Deaths case",
            color: 'red',
            yValueFormatString: "#,##0",
            dataPoints: totalDeath
          }
        ]
      });
      chart4.render();
    })
}

