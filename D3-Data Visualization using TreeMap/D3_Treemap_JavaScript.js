if(parent.document.getElementsByTagName("iframe")[0]) {
	parent.document.getElementsByTagName("iframe")[0].setAttribute('style', 'height: 800px !important');
}

var margin = {top: 20, right: 0, bottom:25, left: 0},
	width = 1420,
	height = 750 - margin.bottom,
	formatNumber = d3.format(".2s"),
	transitioning,
	headerHeight = 20,
	headerColor = "#555555";

var x = d3.scale.linear()
		  .domain([0, width])
		  .range([0, width]);
var y = d3.scale.linear()
	      .domain([0, height])
		  .range([0, height]);

var svg = d3.select("#chart")
.append("svg")
.attr("width", width )
.attr("height", height + margin.bottom + margin.top)
.style("margin-left", -margin.left + "px")
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
.style("shape-rendering", "crispEdges")

var treemap = d3.layout.treemap()
.round(false)
.children(function(d, depth) { return depth ? null : d.children; })
.sort(function(a, b) { return a.value - b.value; });

var grandparent = svg.append("g")
.attr("class", "grandparent");

grandparent.append("rect")
.attr("y", -margin.top)
.attr("width", width)
.attr("height", margin.top);

grandparent.append("text")
.attr("x", 6)
.attr("y", 6 - margin.top)
.attr("dy", ".75em");

var data_colorScale;
function colorcode(colorScale) {
	data_colorScale = colorScale;
}


function loadData(root) {
	initialize(root);
	accumulate(root);
	layout(root);
	display(root);
}


function initialize(root) {
	root.x = root.y = 0;
	root.dx = width;
	root.dy = height;
	root.depth = 0;
}
function accumulate(d) {
	return d.children
	? d.value = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
	: d.value;		
}
function layout(d) {
	if (d.children) {
		treemap.nodes({children: d.children});
		d.children.forEach(function(c) {
			c.x = d.x + c.x * d.dx;
			c.y = d.y + c.y * d.dy;
			c.dx *= d.dx;
			c.dy *= d.dy;
			c.parent = d;
			layout(c);
		});
	}
}
function rect(rect) {
	rect.attr("x", function(d) { return x(d.x); })
	    .attr("y", function(d) { return y(d.y); })
	    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
	    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y);})
	    .style("fill", function(d){
	    	return d.children ? data_colorScale(d.parent.name) : "green";
	    })
	    .attr("stroke", "white");
}
function  foreign(foreign) {
	foreign.attr("x", function(d) { return x(d.x);})
		.attr("y", function(d) { return y(d.y);})
		.attr("width", function(d) {return x(d.x +d.dx) - x(d.x); })
		.attr("height", function(d) {return y(d.y +d.dy) - y(d.y); });
}
function name(d) {
	return d.parent ? name(d.parent) + "." + d.name : d.name;
}
function display(d) {
	
	var legend = svg.selectAll(".legend")
	.data(data_colorScale.domain().slice())
	.enter()
	.append("g")
	.attr("class", "legend")
	.attr("transform", function (d, i) { return "translate(" + i * 150 + ",0)"; });

	grandparent
		.datum(d.parent)
		.on("click", transition)
		.select("text")
		.text(d.name);
	var g1 = svg.insert("g", ".grandparent");
	
	var g = g1.selectAll("g")
		.data(d.children)
		.enter()
			.append("g");
	
	g.append("rect")
		.attr("class", "parent")
		.call(rect);
	
	legend.append("rect")
	.attr("x", 0)
	.attr("y", height + 5)
	.attr ("width", 180)
	.attr ("height", 100)
	.style("fill", data_colorScale);

	legend.append("text")
	.attr("x", 125)
	.attr("y", height)
	.attr("dy", "1.80em")
	.attr("stroke", "black")
	.style("text-anchor", "end")
	.text(function (d) { return d; });
	
	var k = g.selectAll(".child")
					.data(function(d) { return d.children || [d]; })
						.enter();
	k.append("rect")
		.attr("class", "child")
		.call(rect)
		.append("title")
		.text(function(d) {return d.name + "-" + formatNumber(d.value);});
	k.append("foreignObject")
		.call(rect)
		.attr("class","foreignobj")
		.append("xhtml:div")
		.html(function(d) { return d.name; })
		.attr("class", function(d) { 
			if((d.dy <= 25 && d.dx <= 25) || 
			   (d.dy <= 25 && d.dx > 25) ||
			   (d.dy > 25 && d.dx <= 25)
			) {
				return "textdiv_xs";
			}
			if((d.dy > 25 && d.dy <=50) && (d.dx > 25 && d.dx <=50) ||
			   (d.dy > 50 && d.dy <=75) && (d.dx > 50 && d.dx <=75)	
			) {
				return "textdiv_s";
			}
			if(((d.dy > 25 && d.dy <=50) && d.dx > 25) ||
			   (d.dy > 25 && (d.dx > 25 && d.dx <=50)) ||
			   ((d.dy > 50 && d.dy <=75) && d.dx > 50) ||
			   (d.dy > 50 && (d.dx > 50 && d.dx <=75))
				) {
						return "textdiv_s";
			}
			if((d.dy > 75 && d.dy <=100) && (d.dx > 75 && d.dx <=100) ||
				((d.dy > 75 && d.dy <=100) && d.dx > 75)               ||
				(d.dy > 75 && (d.dx > 75 && d.dx <=100 ))
				) {
						return "textdiv_m";
				}
			if (d.dy > 100 && d.dx > 100 || d.dy < 100 && d.dx > 100 || d.dy > 100 && d.dx < 100) {
				return "textdiv";
			}
		});
		
	g.filter(function(d) { return d.children; })
	.classed("children", true)
	.on("click", transition);
	
	// create transition function for transitions
	function transition(d) {
	if (transitioning || !d) return;

	transitioning = true;
	var g2 = display(d);
	t1 = g1.transition().duration(750),
	t2 = g2.transition().duration(500);


	// Update domain only after entering new elements
	x.domain([d.x, d.x + d.dx]);
	y.domain([d.y, d.y + d.dy]);

	//Transition to new view.
	g2.selectAll("rect").call(rect);
	g2.append("foreignObject")
	.call(rect)
	.attr("class", "foreignobj")
	.append("xhtml:div")
	.html(function(d) {
	if (d.children) {return d.name;}
	}) ;
	g2.selectAll(".foreignobj").call(foreign);

	// Remove the old node when the trainsition is finished.
	t1.remove().each("end", function() {
	svg.style("shape_rendering", "crispEdges");
	transitioning = false;
	});
  }
	
		return g;
}
