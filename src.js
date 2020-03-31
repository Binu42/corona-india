var width = window.innerWidth, height = window.innerHeight;

var projection = d3.geoMercator();

var path = d3.geoPath()
  .projection(projection)
  .pointRadius(2);

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

var g = svg.append("g"),
  tooltip = d3
    .select("body")
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


let prevVal = 0,
  apiResp = null;
function prev() {
  populate(++prevVal);
}
function nxt() {
  populate(--prevVal);
}
function populate(t) {
  // $("#nxtBtn").attr("disabled", 0 === t),
  //   $("#prevBtn").attr("disabled", t === apiResp.data.length - 1);
  const e = apiResp.data.slice().reverse()[t],
    {
      total: a,
      discharged: s,
      deaths: n,
      confirmedCasesForeign: o,
      confirmedCasesIndian: i
    } = e.summary;
  console.log(e.summary)
  // $("#total_cases").html(a),
  //   $("#indian_cases").html(i),
  //   $("#foreign_cases").html(o),
  //   $("#death_cases").html(n),
  //   $("#cure_cases").html(s);
  let r =
    '<h2 style="color:white;">Indian States Stats</h2><table class="myTable">\n                      <thead>\n                     <tr>\n                      <th>State</td>\n                      <th>Cases</td>\n                      <th>Deaths</td>\n                      <th>Cured</td>\n                      </tr>\n                      </thead>\n                      <tbody>\n                      ';
  (casesByState = {}),
    e.regional.forEach(t => {
      const {
        confirmedCasesForeign: e,
        confirmedCasesIndian: a,
        discharged: s,
        deaths: n,
        loc: o
      } = t;
      (casesByState[o] = [a, e, n, s]),
        (r += `<tr><td>${o.replace("Union Territory of ", "")}</td><td>${a +
          e}</td><td>${n}</td><td>${s}</td></tr>`);
    }),
    (r += "</tbody></table>");
  // $("#table").html(r),
  // $(".myTable").DataTable({ paging: !1, bFilter: !1, order: [[1, "desc"]] });
  var l = d3
    .scaleLinear()
    .domain([-2, parseInt(45), 75])
    .range(["#ddd", "#0794DB", "#050D7F"]);
  d3.json(
    "https://raw.githubusercontent.com/roshanchokshi/roshanchokshi.github.io/master/map.json",
    function (t, e) {
      g.selectAll(".subunit")
        .data(topojson.feature(e, e.objects.polygons).features)
        .transition()
        .duration(700)
        .style("fill", function (t, e) {
          const a = t.properties.st_nm;
          return a in casesByState
            ? l(casesByState[a][0] + casesByState[a][1])
            : "#ddd";
        });
    }
  );
}

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

  g.selectAll(".place-label")
    .data(topojson.feature(data, data.objects.places).features)
    .enter().append("text")
    .attr("class", "place-label")
    .attr("transform", function (d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
    .attr("dy", ".35em")
    .attr("x", 6)
    .attr("text-anchor", "start")
    .style("font-size", ".7em")
    .style("text-shadow", "0px 0px 2px #fff")
    .text(function (d) { return d.properties.name; });

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
        .style("left", d3.event.pageX + 20 + "px")
        .style("top", d3.event.pageY - 48 + "px");
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
    console.log(data.data.data.statewise);
    const stateData = data.data.data.statewise;
    // apiResp = data;
    // populate();
    stateData.forEach(data => {
      casesByState[data.state] = { confirmed: data.confirmed, recovered: data.recovered, deaths: data.deaths, active: data.active }
    })
  })