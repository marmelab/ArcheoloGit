ArcheoloGit
===========


<table>
        <tr>
            <td><img width="60" src="https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/svg/book.svg" alt="publication" /></td>
            <td><strong>Archived Repository</strong><br />
            The code of this repository was written to illustrate the blog post <a href="https://marmelab.com/blog/2014/05/15/archeologit.html">Blog post title</a><br />
        <strong>This code is not intended to be used in production, and is not maintained.</strong>
        </td>
        </tr>
</table>

Where should you focus the maintenance efforts? ArcheoloGit is a visualization of age and dev activity for software, powered by d3.js.

![angular.js ArcheoloGit](http://marmelab.com/ArcheoloGit/angularjs.png)

ArcheoloGit displays all files of a given application as rectangles. The size of each rectangle is proportional to the number of commits, the color is green if the file was recently modified, red if it hasn't been modified for a long time.

Therefore:

1. Large red rectangles show files modified often, but untouched for a long time. These are the files you should dig in first for refactoring.
2. Small red rectangles show files seldom modified, and untouched for a long time. These files require your attention, because they could contain hidden bombs.
3. Small green rectangles show files seldom modified, but created or modified recently. They won't need refactoring for now.
4. Large green rectangles show files modified a lot of times, including recently. They probably don't deserve maintenance attention.

To learn more about ArcheoloGit, check out [why we built ArcheoloGit](http://marmelab.com/blog/2014/05/15/archeologit.html).

# Installation

* clone the project

```sh
    git clone git@github.com:marmelab/ArcheoloGit.git
    cd ArcheoloGit
```

* install server dependencies using Bower

```sh
bower install
```

* run the `run.sh` script with the path of the project you want to analyze as argument.

```sh
./run.sh /path/to/project/to/analyze
```

* run a simple local server on the root, for instance with SimpleHttpServer:

```sh
# Python 2.7
python -m SimpleHTTPServer
# Python 3
python -m http.server
```

* browse to the index, for instance [http://0.0.0.0:8000/](http://0.0.0.0:8000/) if you use SimpleHttpServer

# Usage

You can see the details of a file by hovering the mouse.

If there is too many elements and the graph is not usable, you can change the max depth and then browse the file tree.
To go inside a folder, simply click on it. To go back to its parent or to the previous view, use the browser's back button.
