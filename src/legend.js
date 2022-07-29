import * as d3 from "d3";
import { chart as baseChart, config } from "lotivis-chart";
import { colorSchemeDefault, ColorsGenerator } from "lotivis-colors";

var legendIndex = 0;

export function legend() {
  let attr = {
    // the id of the legend
    id: "legend-" + ++legendIndex,

    // margin
    marginLeft: 0,
    marginTop: 10,
    marginRight: 0,
    marginBottom: 20,

    // whether the legend is enabled
    enabled: true,

    // the number formatter vor values displayed
    numberFormat: config.numberFormat,

    // the format of displaying a datasets label
    labelFormat: function (l, v, i) {
      return `${l} (${v})`;
    },

    // the format of displaying a datasets group
    groupFormat: function (s, v, ls, i) {
      return `${s}`;
    },

    // the format of displaying a group
    sectionFormat: function (s, v, ls, i) {
      return `${i + 1}) ${s} (Sum: ${v})`;
    },

    // color scheme to use
    colorScheme: colorSchemeDefault,

    // (optional) title of the legend
    title: null, // (chart) => null

    // whether to display groups instead of labels
    groups: false, // (chart) => false

    // whether to create separate sections (by groups)
    sections: false, // (chart) => false

    // the data controller
    dataController: null,
  };

  var chart = baseChart(attr);

  function toggleLabel(event, label) {
    event.target.checked
      ? attr.dataController.removeFilter("labels", label, chart)
      : attr.dataController.addFilter("labels", label, chart);
  }

  function toggleGroup(event, group) {
    event.target.checked
      ? attr.dataController.removeFilter("groups", group, chart)
      : attr.dataController.addFilter("groups", group, chart);
  }

  function labelChecked(label) {
    return attr.dataController.isFilter("labels", label) ? null : true;
  }

  function groupChecked(group) {
    return attr.dataController.isFilter("groups", group) ? null : true;
  }

  function format(value) {
    return typeof attr.numberFormat === "function"
      ? attr.numberFormat(value)
      : value;
  }

  function labelText(label, index, dv) {
    return typeof attr.labelFormat !== "function"
      ? label
      : attr.labelFormat(label, format(dv.byLabel.get(label)), index);
  }

  function groupText(group, index, dv) {
    if (typeof attr.groupFormat !== "function") return group;
    var value = format(dv.byGroup.get(group)),
      labelsToValue = dv.byGroupLabel.get(group),
      labels = Array.from(labelsToValue ? labelsToValue.keys() : []);
    return attr.groupFormat(group, value, labels, index);
  }

  function disabled() {
    return unwrap(attr.enabled) ? null : true;
  }

  function isGroups() {
    return unwrap(attr.groups) === true;
  }

  function isSections() {
    return unwrap(attr.sections) === true;
  }

  function unwrap(value) {
    return typeof value === "function" ? value(chart) : value;
  }

  chart.dataView = function () {
    var dc = attr.dataController;
    if (!dc) throw new Error("no data controller");

    var dv = {};
    dv.data = dc.data();
    dv.labels = dv.data.labels;
    dv.groups = dv.data.groups;
    dv.locations = dv.data.locations;
    dv.dates = dv.data.dates;

    dv.byLabel = d3.rollup(
      dv.data,
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.label
    );

    dv.byGroup = d3.rollup(
      dv.data,
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.group || d.label
    );

    dv.byGroupLabel = d3.rollup(
      dv.data,
      (v) => d3.sum(v, (d) => d.value),
      (d) => d.group || d.label,
      (d) => d.label
    );

    return dv;
  };

  chart.render = function (container, calc, dv) {
    calc.colors = ColorsGenerator(attr.colorScheme).data(dv.data);
    calc.div = container
      .append("div")
      .classed("ltv-legend", true)
      .attr("id", attr.id)
      .style("margin-left", attr.marginLeft + "px")
      .style("margin-top", attr.marginTop + "px")
      .style("margin-right", attr.marginRight + "px")
      .style("margin-bottom", attr.marginBottom + "px");

    // if a title is given render div with title inside
    if (attr.title) {
      calc.titleDiv = calc.div
        .append("div")
        .classed("ltv-legend-title", true)
        .text(unwrap(attr.title));
    }

    var colorFn = isGroups() ? calc.colors.group : calc.colors.label,
      changeFn = isGroups() ? toggleGroup : toggleLabel,
      textFn = isGroups() ? groupText : labelText;

    calc.sections = calc.div
      .selectAll(".div")
      .data(isSections() ? dv.groups : [""]) // use single group when mode is not "groups"
      .enter()
      .append("div")
      .classed("ltv-legend-group", true)
      .style("color", (s) => calc.colors.group(s));

    // draw titles only in "sections" mode
    if (isSections()) {
      calc.titles = calc.sections.append("div").text((section, index) => {
        var labelsToValue = dv.byGroupLabel.get(section),
          value = format(dv.byGroup.get(section)),
          labels = Array.from(labelsToValue ? labelsToValue.keys() : []);
        return attr.sectionFormat(section, value, labels, index);
      });
    }

    var pillsData = isSections()
      ? (d) => (isGroups() ? [d] : dv.byGroupLabel.get(d))
      : isGroups()
      ? dv.groups
      : dv.labels;

    calc.pills = calc.sections
      .selectAll(".label")
      .data(pillsData)
      .enter()
      .append("label")
      .classed("ltv-legend-pill", true)
      .datum((d) => (isSections() && !isGroups() ? d[0] : d));

    calc.checkboxes = calc.pills
      .append("input")
      .classed("ltv-legend-checkbox", true)
      .attr("type", "checkbox")
      .attr("checked", isGroups() ? groupChecked : labelChecked)
      .attr("disabled", disabled())
      .on("change", (e, d) => changeFn(e, d));

    calc.spans = calc.pills
      .append("span")
      .classed("ltv-legend-pill-span", true)
      .style("background-color", colorFn)
      .text((d, i) => textFn(d, i, dv));

    if (attr.debug) console.log(this);

    return chart;
  };

  // return generated chart
  return chart;
}
