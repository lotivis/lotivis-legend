import * as d3 from "d3";
import { chart as baseChart, tooltip, config } from "lotivis-chart";
import { colorSchemeDefault, ColorsGenerator } from "lotivis-colors";

export function legend() {
  let attr = {
    // a unique id for this chart
    id: "legend-" + new Date().getTime(),

    // default selector
    selector: "#ltv-legend-chart",

    // the width of the chart's svg
    width: 1000,

    // the height of the chart's svg
    height: 600,

    // left margin
    marginLeft: config.defaultMargin,

    // top margin
    marginTop: config.defaultMargin,

    // right margin
    marginRight: config.defaultMargin,

    // bottom margin
    marginBottom: config.defaultMargin,

    // whether the chart is enabled.
    enabled: true,

    // the data controller
    dataController: null,
  };

  // create new underlying chart with specified attributes
  let chart = baseChart(attr);

  chart.dataView = function () {
    let dc = attr.dataController;
    if (!dc) throw new Error("no data controller");

    let dv = {};

    dv.data = dc.data();
    dv.snapshot = dc.snapshot();

    return dv;
  };

  chart.render = function (container, calc, dv) {
    calc.graphWidth = attr.width - attr.marginLeft - attr.marginRight;
    calc.graphHeight = attr.height - attr.marginTop - attr.marginBottom;
    calc.graphBottom = attr.height - attr.marginBottom;
    calc.graphRight = attr.width - attr.marginRight;
    calc.colors = ColorsGenerator(attr.colorScheme).data(dv.data);

    // todo ...
  };

  // return generated chart
  return chart;
}
