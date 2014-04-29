/*
 * initialize datas
 */
var ramp = d3.scale.linear().domain([0,100]).range(["green","red"]),
    olderUnchangedDays = 0,
    totalLevels = 1,
    currentLevel = 1,
    currentParent = null,
    BACK_KEY = 37,

    formattedDatas = {
        name: '/',
        children: []
    },

    margin = {top: 40, right: 10, bottom: 10, left: 10},
    width = 1280 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom,
    x = d3.scale.linear().range([0, width]),
    y = d3.scale.linear().range([0, height]),
    root,
    node,

    treemap = d3.layout.treemap()
        .round(false)
        .size([width, height])
        .sticky(true)
        .value(function(d) {
            return d.size;
        }),

    svg = d3.select("#body")
        .append("div")
            .attr("class", "chart")
            .style("width", width + "px")
            .style("height", height + "px")
        .append("svg:svg")
            .attr("width", width)
            .attr("height", height)
        .append("svg:g")
            .attr("transform", "translate(.5,.5)")
            .attr("id", "chart");

    filter = svg
        .append("defs")
        .append("svg:filter")
            .attr("id", "outerDropShadow")
            .attr("x", "-20%")
            .attr("y", "-20%")
            .attr("width", "140%")
            .attr("height", "140%")
        .append("svg:feOffset")
            .attr("result", "offOut")
            .attr("in", "SourceGraphic")
            .attr("dx", "1")
            .attr("dy", "1")
        .append("svg:feColorMatrix")
            .attr("result", "matrixOut")
            .attr("in", "offOut")
            .attr("type", "matrix")
            .attr("values", "1 0 0 0 0 0 0.1 0 0 0 0 0 0.1 0 0 0 0 0 .5 0")
        .append("svg:feGaussianBlur")
            .attr("result", "blurOut")
            .attr("in", "matrixOut")
            .attr("stdDeviation", "3")
        .append("svg:feBlend")
            .attr("in", "SourceGraphic")
            .attr("in2", "blurOut")
            .attr("mode", "normal");



/*
 * Build treemap
 */
d3.csv('/datas.csv', function(error, datas) {


    // Create tree from csv datas
    datas.forEach(function(file) {
        createPath(formattedDatas, 0, file);

        var nbOfUnchangedDays = moment().diff(moment(file.date), 'days');
        if (nbOfUnchangedDays > olderUnchangedDays) {
            olderUnchangedDays = nbOfUnchangedDays;
        }
    });

    node = root = formattedDatas;

    var nodes = treemap.nodes(root).filter(function(d) {
        return d.level < currentLevel;
    });

    initTreeMap(nodes, true);

    // Build level select list
    for(var i=1; i<=totalLevels; i++) {
        d3.select('#level select')
            .append("option")
            .attr("value", i)
            .text(i);
    }

    // Listener on level select list
    d3.select("select").on("change", function() {
        currentLevel = 1;
        var maxLevel = +this.value;

        var nodes = treemap.nodes(root).filter(function(d) {
            return d.level < maxLevel;
        });

        initTreeMap(nodes, true);
    });

    // Listener on return key
    d3.select("body").on("keydown", function(d) {
        if(d3.event.keyCode == BACK_KEY && currentLevel > 1 && currentParent !== null) {

            initTreeMap(currentParent.children, true);
            zoom(currentParent);

            currentLevel--;
            currentParent = currentParent.parent;
        }
    });
})





function initTreeMap(nodes, display) {

    svg.selectAll("#chart g").remove();

    var cell = svg.selectAll("#chart g").data(nodes).enter().append("svg:g")
        .attr("class", "cell")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .on("click", function(d) {

            if(typeof(d.children) == 'undefined') {
                return;
            }

            currentLevel = d.level + 2;
            currentParent = d.parent;
            initTreeMap(d.children, false);
            zoom(d);
        })
        .on("mouseover", function(d) {
            this.parentNode.appendChild(this); // workaround for bringing elements to the front (ie z-index)
            d3.select(this)
                .attr("filter", "url(#outerDropShadow)")
                .select(".background")
                .style("stroke", "#000000");

            var detail = d3.select("#detail");
            detail.select('.name').text(d.filepath);
            detail.select('.commits').text(d.size);
            detail.select('.days').text(d.days);
            detail.style('display', 'block');
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("filter", "")
                .select(".background")
                .style("stroke", "#FFFFFF");
            var detail = d3.select("#detail");
            detail.style('display', 'none');
        });


    var rect = cell.append("svg:rect")
        .style("fill", function(d) {
            return ramp((d.days * 100) / olderUnchangedDays);
        })
        .classed("background", true);

    if(display) {
        rect
            .attr("width", function(d) {
                return Math.max(0.01, d.dx);
            })
            .attr("height", function(d) {
                return Math.max(0.01, d.dy);
            })
        ;
    }

    var text = cell.append("svg:text")
        .attr("text-anchor", "middle")
        .text(function(d) {
            return d.filepath;                      // d.name
        })
        .style("display", function(d) {
            d.w = this.getComputedTextLength();
            return d.dx > d.w ? 'block' : 'none';
        });

    if(display) {
        text
            .attr("x", function(d) {
                return d.dx / 2;
            })
            .attr("y", function(d) {
                return d.dy / 2;
            })
            .attr("dy", ".35em")
        ;
    }

    return treemap;
}


/**
 *
 * @param d
 * @returns {*|number|Number|string|size|Rs.size}
 */
function size(d) {
    return d.size;
}

function level(d) {
    return d.level < currentLevel;
}


/**
 *
 * @param d
 */
function zoom(d) {
    var kx = width  / d.dx;
    var ky = height / d.dy;
    x.domain([d.x, d.x + d.dx]);
    y.domain([d.y, d.y + d.dy]);

    var transition = svg.selectAll("g.cell").transition().duration(750)
        .attr("transform", function(d) {
            return "translate(" + x(d.x) + "," + y(d.y) + ")";
        });

    transition.select("rect")
        .attr("width", function(d) {
            return Math.max(0.01, kx * d.dx);
        })
        .attr("height", function(d) {
            return Math.max(0.01, ky * d.dy);
        })
        .style("fill", function(d) {
            return ramp((d.days * 100) / olderUnchangedDays);
        })
    ;

    transition.select("text")
        .attr("x", function(d) {
            return kx * d.dx / 2;
        })
        .attr("y", function(d) {
            return ky * d.dy / 2;
        })
        .style("display", function(d) {
            d.w = this.getComputedTextLength();
            return d.dx > d.w ? 'block' : 'none';
        });

    node = d;

    if (d3.event) {
        d3.event.stopPropagation();
    }
}


/**
 *
 * @param cursor
 * @param level
 * @param file
 * @returns {*}
 */
function createPath(cursor, level, file) {
    var filePaths = file.filePath.split('/'),
        path = filePaths[level];

    totalLevels = Math.max(level, totalLevels);

    // If we are at the last level of the filepath, the file cannot already be in the formattedDatas
    // so we push it and we return to handle the next file
    if(level === filePaths.length - 1) {

        var days = moment().diff(moment(file.date), 'days');

        cursor.children.push({
            name: path,
            filepath: file.filePath,
            days: days,
            size: file.nbCommits,
            level: level
        });

        if(cursor.days < days) {
            cursor.days = days;
        }

        return;
    }

    // We loop on the children to know if the element is already in the formattedDatas
    // if so, we call this method on its children, with one more level in the filepath
    for(var i in cursor.children) {
        if (!cursor.children.hasOwnProperty(i)) {
            continue;
        }
        var child = cursor.children[i];

        if(child.name === path) {
            return createPath(child, level + 1, file);
        }
    };

    // The element is not already in the formattedDatas
    // we add it, and then call this method on its empty children, with one more level in the filepath
    var child = {
        name: path,
        filepath: filePaths.slice(0, level + 1).join('/').concat('/'),
        level: level,
        days:0,
        children: []
    };

    cursor.children.push(child)
    createPath(child, level + 1, file);
}
