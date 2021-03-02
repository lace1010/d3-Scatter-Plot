const url =
  "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/cyclist-data.json";
let width = 700;
let height = 500;
let xPadding = 60;

// Tooltip
let tooltip = d3
  .select("#scatter-plot")
  .append("div")
  .style("opacity", "0")
  .attr("id", "tooltip");

let svgContainer = d3
  .select("#scatter-plot")
  .append("svg")
  .attr("width", width)
  .attr("height", height + 35)
  .attr("class", "graph");

// Add Title to chart
svgContainer
  .append("text")
  .attr("x", width / 2)
  .attr("y", 35)
  .attr("text-anchor", "middle") // Centers the text horizontally. The anchor is what is placed on x attribute. Instead of putting the left part of text at X. It puts the middle part of text at x
  .text("Doping in Professional Bicycle Racing")
  .attr("id", "title");

// Add Title to chart
svgContainer
  .append("text")
  .attr("x", width / 2)
  .attr("y", 65)
  .attr("text-anchor", "middle") // Centers the text horizontally. The anchor is what is placed on x attribute. Instead of putting the left part of text at X. It puts the middle part of text at x
  .text("35 Fastest times up Alpe d'Huez")
  .attr("id", "sub-title");

d3.json(url, function (error, data) {
  if (error) {
    throw error;
  }

  // Start  of xScale
  let year = data.map((element) => element.Year); // Make an array of only the Years
  let minYear = d3.min(year);
  let maxYear = d3.max(year);

  const xScale = d3
    .scaleLinear() // Use scaleLinear because the string used is just the year string which we can not use for a date as there is no month or day in the data.
    .domain([minYear - 1, maxYear + 1]) // Domain is the years between max and min of data given. We use minus one and plus one to make sure there are no points on an axis or at last point at end of axis
    .range([xPadding, width - xPadding]); // Range is changed to give padding to left and right of svg

  const xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d")); // We add the tickFormat(d3.format("d")) to get rid of the commas in each year string.

  // Call on xAxis and append it into the svgContainer.
  svgContainer
    .append("g")
    .attr("transform", "translate(0," + height + ")") // Places the xAxis at bottom of svg
    .call(xAxis)
    .attr("id", "x-axis");

  // Start yScale
  let specifier = "%M:%S"; // Changes format to minutes and seconds
  let parsedData = data.map((element) => d3.timeParse(specifier)(element.Time)); // We parse the time with the specifier and with the element's time. This is another way of getting a date such as the Date() method.

  let yScale = d3
    .scaleTime()
    .domain([d3.min(parsedData), d3.max(parsedData)]) // We use the parsedData which gives a date() (time)
    .range([100, height]); // We don't flip as the faster (smallest) time is considered the greater number. Use 10 so graph doesn't hit top of svgContainer

  let yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickFormat((d) => d3.timeFormat(specifier)(d)); // We must add tickFormat so the ticks on axis are in minute:second format

  // Call on yAxis and append it into the svgContainer
  svgContainer
    .append("g")
    .attr("transform", "translate(" + xPadding + ")")
    .call(yAxis)
    .attr("id", "y-axis");

  svgContainer
    .selectAll("circle")
    .data(data) // Use the data given by the url inside the function.
    .enter()
    .append("circle")
    .attr("cx", (d, i) => xScale(data[i].Year)) // Gives the year value for each element depending on index
    .attr("cy", (d, i) => yScale(parsedData[i])) // We use parsedData as it is the array that has the time in date() format
    .attr("r", 5)
    .attr("class", "dot")
    .style("stroke", "black")
    // use a ternary operator to give different color to people who have no doping allegations
    .style("fill", (d) => (d.Doping === "" ? "gold" : "darkcyan"))
    .attr("data-xvalue", (d, i) => d.Year) // Gives the year for each element to data-xValue
    .attr("data-yvalue", (d, i) => parsedData[i]) // Have to use parsedData as it converted time to a Date(). Gives the time for each element to data-yvalue
    .on("mouseover", function (d) {
      tooltip.style("opacity", ".9");
      tooltip
        .style("left", d3.event.pageX + 15 + "px")
        .style("top", d3.event.pageY - 70 + "px")
        .html(
          d.Name +
            ": " +
            d.Nationality +
            "<br> Year: " +
            d.Year +
            ", Time: " +
            d.Time +
            "<br> Place: " +
            d.Place +
            (d.Doping == "" ? "" : "<br> <br>" + d.Doping)
          // If there is no doping allegation then do not add anymore. If there are break line twice and show doping allegations
        )
        .attr("data-year", d.Year); // Added to complete challenge. Do not need function as we are in mouseover and the d stands for the datapoint that is being moused over
    })
    .on("mouseout", function (d) {
      tooltip.style("opacity", "0");
      tooltip.style("top", -2000 + "px"); // Add this line to move tooltip off svg when mouseout so the tooltip is not covering another datapoint. Thus being able to use mouseover for points that would otherwise be behind the tooltip
    });

  // Start legend
  // First create an array with all of the legends you want. (We will get two with this array)
  const keys = ["Riders with doping allegations", "No doping allegations"];
  // Then set color array to scaleOrdinal with domain as the legends array and range is the color scheme (can normally use d3.schemeCategory10), but I wanted to use my custom colors
  const color = d3.scaleOrdinal().domain(keys).range(["darkCyan", "gold"]);
  let rectSize = 20; // Set a size for the rectangles

  svgContainer
    .selectAll("#legend")
    .data(keys)
    .enter()
    .append("rect")
    .attr("id", "legend")
    .attr("x", width - 180) // Places the legends to 150px from the right side of the svgContaner
    .attr("y", (d, i) => -rectSize + height / 2 + i * (rectSize + 10)) // Places the y halfway down and then pushes next one further down by multiplying the index by the rectSize. We add 10 to seperate them by 10px
    // Threw in the -rectSize to move legend up a rectangle so now they are both equally centered verically instead of just the first one being in the center and the second one being pushed down below the center
    .attr("width", rectSize)
    .attr("height", rectSize)
    .style("stroke", "black")
    .style("fill", (d, i) => color(d)); // Sets a color for each legend based off index from both keys and color array

  svgContainer
    .selectAll(".legend-label")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", width - 180 + rectSize + 5) // Moves text to 5px to the right of the rectangle
    .attr(
      "y",
      (d, i) => -rectSize + height / 2 + i * (rectSize + 10) + rectSize / 2
    )
    .style("alignment-baseline", "middle") // We use this so that the middle of the rectangle is used and not the top. This is just like text-anchor center but for vertical situations
    .style("font-size", "12")
    .text((d, i) => d); // Gives the text we want from the array keys we are using
});
