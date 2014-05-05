(function(window, undefined){

    /*
     * initialize global data
     */
    var ramp = d3.scale.linear().domain([0,100]).range(["green","red"]),
        olderUnchangedDays = 0,
        totalLevels = 1,
        currentLevel = 1,
        firstLevel = 1,
        currentParent = null,
        prevStep =  null,
        currentStep = History.getState(),

        margin = {top: 100, right: 100, bottom: 0, left: 100},
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - margin.bottom,
        x = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([0, height]),
        root,

        treemap = d3.layout.treemap()
            .round(false)
            .size([width, height])
            .sticky(true)
            .value(getCommits),

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


    /**
     * Initialize the tree map
     *
     * @param {Array} nodes
     * @param {Boolean} display
     */
    function initTreeMap(nodes, display) {
        // Remove existing cells from csv element
        svg.selectAll("#chart g").remove();

        // Create new cells
        var cell = svg
            .selectAll("#chart g").data(nodes).enter()
            .append("svg:g")
            .attr("class", function(d) {
                return typeof(d.class) !== 'undefined' ? "cell file" : "cell";
            })
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })

            // Add new listeners on cells
            .on("click", function(d) {
                if(typeof(d.children) == 'undefined') {
                    return;
                }

                changeParent(d);
                History.pushState({element: d.filepath}, "Set Parent" + d.parent.filepath, "?parent=" + d.filepath);
            })
            .on("mouseover", function(d) {
                // workaround for bringing elements to the front (ie z-index)
                this.parentNode.appendChild(this);

                d3.select(this)
                    .attr("filter", "url(#outerDropShadow)")
                    .select(".background")
                    .style("stroke", "#000000");

                var detail = d3.select("#detail");
                detail.select('.name').text(d.filepath);
                detail.select('.commits').text(d.commits);
                detail.select('.days').text(d.days);
                detail.style('opacity', 1);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("filter", "")
                    .select(".background")
                    .style("stroke", "#FFFFFF");

                d3.select("#detail")
                    .style('opacity', 0);
            });

        // Add rect element to cells
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

        // Add text elements to cells
        var text = cell.append("svg:text")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.filepath;
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
    }

    /**
     *
     * @param {Object} d
     *
     * @returns {Number}
     */
    function getCommits(d) {
        return d.commits;
    }

    /**
     * Handle the transition to a given element of the root tree
     *
     * @param {Object} d
     */
    function zoom(d) {
        var kx = width / d.dx;
        var ky = height / d.dy;

        x.domain([d.x, d.x + d.dx]);
        y.domain([d.y, d.y + d.dy]);

        var transition = svg.selectAll("g.cell").transition()
            .duration(750)
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
            });

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

        if (d3.event) {
            d3.event.stopPropagation();
        }
    }

    /**
     * Build the root tree object
     * (called recursively for each element fetched from the csv file)
     *
     * @param {Object} cursor  element of the root tree
     * @param {Number} level   level of the element in the root tree (depth)
     * @param {Object} file    data fetch from the csv file to build the root tree
     *
     * @returns {Object}
     */
    function createPath(cursor, level, file) {
        var filePaths = file.filePath.split('/'),
            path = filePaths[level];

        totalLevels = Math.max(level, totalLevels);

        // If we are at the last level of the filepath, the file cannot already be in the formattedDatas
        // so we push it and we return to handle the next file
        if(level === filePaths.length - 1) {

            var days = moment().diff(moment(file.date), 'days'),
                commits = Number(file.commits);

            cursor.children.push({
                name: path,
                filepath: file.filePath,
                days: days,
                commits: commits,
                level: level,
                class: "file"
            });

            if(cursor.days < days) {
                cursor.days = days;
            }

            return {commits: commits, days: days};
        }

        // We loop on the children to know if the element is already in the formattedDatas
        // if so, we call this method on its children, with one more level in the filepath
        for (var i in cursor.children) {
            if (!cursor.children.hasOwnProperty(i)) {
                continue;
            }
            var child = cursor.children[i];

            if(child.name === path) {
                var childInfo = createPath(child, level + 1, file);
                child.commits += childInfo.commits;
                child.days = Math.max(childInfo.days, child.days);

                return childInfo;
            }
        }

        // The element is not already in the formattedData
        // we add it, and then call this method on its empty children, with one more level in the filepath
        var child = {
            name: path,
            filepath: filePaths.slice(0, level + 1).join('/').concat('/'),
            level: level,
            days: 0,
            commits: 0,
            children: []
        };

        cursor.children.push(child);
        var childInfo = createPath(child, level + 1, file);

        child.commits = childInfo.commits;
        child.days = childInfo.days;
        return childInfo;
    }

    function getElementFromPath(cursor, level, filePath) {
        var filePaths = filePath.split('/'),
            path = filePaths[level];

        for (var i in cursor.children) {
            if (!cursor.children.hasOwnProperty(i)) {
                continue;
            }
            var child = cursor.children[i];

            if(child.name === path) {
                if(level === filePaths.length - 2) {
                    return child;
                }

                return getElementFromPath(child, level + 1, filePath);
            }
        }

        return null;
    }

    /**
     * Updates the map to a desired level
     *
     * @param {Number} desiredLevel
     */
    function changeLevel(desiredLevel) {
        currentLevel = 1;

        var nodes = treemap.nodes(root).filter(function(d) {
            return d.level < desiredLevel;  //  < as level start at 0 in the root object
        });

        initTreeMap(nodes, true);

        d3.select("select")[0][0].value = desiredLevel;
    }

    /**
     * Updates the char with the given element
     *
     * @param {Object} element
     */
    function changeParent(element) {
        currentLevel = element.level + 2;
        currentParent = element.parent;
        initTreeMap(element.children, false);

        zoom(element);
    }

    // Bind to StateChange Event
    History.Adapter.bind(window,'statechange', function(){
        var state = History.getState(),
            stateData = state.data;

        prevStep = currentStep;
        currentStep = state;

        // Returns to the first loaded page (with a hash)
        if (JSON.stringify(stateData) === '{}') {
            return changeLevel(firstLevel);
        }

        // Returns to the an empty URL hash (the first page without hash)
        if (typeof(stateData.add) !== undefined && stateData.add === false) {
            return changeLevel(totalLevels);
        }

        if (typeof(stateData.element) !== 'undefined') {
            var parent = getElementFromPath(root, 0, stateData.element);

            if (parent) {
                return changeParent(parent);
            }
        }

        if (typeof(stateData.level) !== 'undefined') {
            return changeLevel(+stateData.level);
        }
    });

    /**
     *
     * Retrieve data
     *
     */

    d3.csv('/datas.csv', function(error, datas) {

        var formattedDatas = {
            name: '/',
            children: []
        },
        historyState = History.getState();

        // Create tree from csv data
        datas.forEach(function(file) {
            createPath(formattedDatas, 0, file);

            var nbOfUnchangedDays = moment().diff(moment(file.date), 'days');
            if (nbOfUnchangedDays > olderUnchangedDays) {
                olderUnchangedDays = nbOfUnchangedDays;
            }
        });

        // Init tree map
        root = formattedDatas;
        var nodes = treemap.nodes(root).filter(function(d) {
            return d.level < totalLevels;
        });
        initTreeMap(nodes, true);

        // Build level select list
        for (var i = 1; i <= totalLevels; i++) {
            d3.select('form select')
                .append("option")
                .attr("value", i)
                .text(i);
        }

        d3.select('form option[value="' + totalLevels + '"]').attr("selected", "selected");
        currentLevel = totalLevels;
        firstLevel = totalLevels;

        if (typeof(historyState.hash) !== 'undefined') {
            // Check if the level or the parent is in the URL
            var levelRegexp = new RegExp("level=([0-9]+)"),
                levelInfos = levelRegexp.exec(historyState.hash),
                parentRegexp = new RegExp("parent=([aA-zZ/]+)"),
                parentInfos = parentRegexp.exec(historyState.hash);

            if (levelInfos && levelInfos.length && levelInfos[1] > 0) {
                firstLevel = +levelInfos[1];
                changeLevel(firstLevel);
            }

            if (parentInfos && parentInfos.length) {
                var parent = getElementFromPath(formattedDatas, 0, parentInfos[1]);
                if (parent) {
                    changeParent(parent);
                }
            }
        }

        // Listener on level select list
        d3.select("select").on("change", function() {
            var desiredLevel = +this.value;
            History.pushState({level: desiredLevel}, "Set level" + desiredLevel, "?level=" + desiredLevel);
            changeLevel(desiredLevel);
        });
    })
})(window);
