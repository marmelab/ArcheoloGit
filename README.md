AttentionMap
============

Where should you focus the maintenance efforts? AttentionMaps is a visualization of age and dev activity for software, powered by d3.js.


# Installation

* clone the project & run `bower install`
* run the `run.sh` script with the path of the project you want to analyze as argument.
* run a simple local server (for example `python -m SimpleHTTPServer`)


# Use

By default, it displays all the files of the project.
You can see the details of a file by passing the mouse over it.

If there is too many elements and the graph is not usable, you can change the max depth and then browse the file tree.
To go inside a folder, simply click on it.
To go back to its parent, click on the `Back` button or press the left direction key.
