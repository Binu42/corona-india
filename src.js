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
    var stateWiseData = '', report = [];
    stateData.forEach((data, index) => {
      if (index === 0) {
        report.push({ name: data.state, y: Math.round((data.confirmed / total.confirmed) * 100), exploded: true })
      } else {
        report.push({ name: data.state, y: Math.round((data.confirmed / total.confirmed) * 100) })
      }
      casesByState[data.state] = { confirmed: data.confirmed, recovered: data.recovered, deaths: data.deaths, active: data.active }
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
    var chart = new CanvasJS.Chart("chartContainer", {
      exportEnabled: true,
      animationEnabled: true,
      title: {
        text: "Covid-19 statewise"
      },
      legend: {
        cursor: "pointer",
        itemclick: explodePie
      },
      data: [{
        type: "pie",
        showInLegend: true,
        toolTipContent: "{name}: <strong>{y}%</strong>",
        indexLabel: "{name} - {y}%",
        dataPoints: report
      }]
    });
    chart.render();
  })


function explodePie(e) {
  if (typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
  } else {
    e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
  }
  e.chart.render();

}

// window.onload = function () {
//   axios.get('https://api.rootnet.in/covid19-in/stats/daily')
//     .then(response => {
//       const total = [], indian = [], foreigner = [];
//       response.data.data.map(day => {
//         console.log(day);
//         total.push({ x: day.day, y: day.total });
//         indian.push({ x: day.day, y: day.confirmedCasesIndian })
//         foreigner.push({ x: day.day, y: day.confirmedCasesForeign })
//       })
//       var chart = new CanvasJS.Chart("chartContainer", {
//         animationEnabled: true,
//         title: {
//           text: "Daily Report of covid-19"
//         },
//         axisX: {
//           valueFormatString: "DDD",
//           minimum: new Date(2020, 10, 03, 23),
//           maximum: new Date(2020, 03, 31, 1)
//         },
//         axisY: {
//           title: "No. of people"
//         },
//         legend: {
//           verticalAlign: "top",
//           horizontalAlign: "right",
//           dockInsidePlotArea: true
//         },
//         toolTip: {
//           shared: true
//         },
//         data: [{
//           name: "Received",
//           showInLegend: true,
//           legendMarkerType: "square",
//           type: "area",
//           color: "rgba(40,175,101,0.6)",
//           markerSize: 0,
//           dataPoints: indian
//         },
//         {
//           name: "Sent",
//           showInLegend: true,
//           legendMarkerType: "square",
//           type: "area",
//           color: "rgba(0,75,141,0.7)",
//           markerSize: 0,
//           dataPoints: total
//         }]
//       });
//       chart.render();
//     })
// }