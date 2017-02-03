var d3SkyLine = (function(d3){
    function setOptions(options){
        var margin = setMargin(options.margin || {});
        
//        var dates = setDates(options.dates || {});
        return {
            width : (options.width || 900) - margin.left - margin.right,
            height : options.height || 600 - margin.top - margin.bottom,
            margin : margin,
            dates : setDates(options.dates || {}),
            barMargin : setMargin(options.barMargin || {}),
            boxesStacked : options.boxesStacked || null,
            boxColour: options.boxColour || "steelblue",
            boxTextColour: options.boxTextColour || "white",
            boxFont: options.boxFont || "10px sans-serif",
            boxWidth : options.boxWidth || null,
            format : options.format || function(data){ return data;},
            key: options.key || '#key',
            keyFormat: options.keyFormat || function(data){ return JSON.stringify(data); }
        };
    };
    
    function setMargin(margin){
        return {
                top : margin.top || 20,
                bottom : margin.bottom || 20,
                left : margin.left || 20,
                right : margin.right || 20
            };
    }
    
    function setDates(dates){
        return {
            start : dates.start || null,
            end : dates.end || null
        };
    }
    
    return function(dom, data, options){
        var settings = setOptions(options);
        var data = data.map(function(current){return settings.format(current)});
        
        var xAxisStart = settings.dates.start || d3.min(data, function(d){ return d.date;});
        var xAxisEnd = settings.dates.end || d3.max(data, function(d){ return d.date;});
        
        var key = d3.select(settings.key);
        
        var svg = d3.select(dom)
                .append("svg")
                .attr("id", "skylineSVG")
                .attr("width", settings.width + settings.margin.left + settings.margin.right)
                .attr("height", settings.height + settings.margin.top + settings.margin.bottom)
                .attr("class","chart")
                .append("g")
                .attr("transform","translate(" + settings.margin.left + "," + settings.margin.top + ")");
        
        var color = d3.scaleLinear()
                .domain([30*24*60, 0 , -1*30*24*60])
                .range(["#FF0000", "#FFFF00","#00FF00"]);

        var x = d3.scaleTime()
                .domain([xAxisStart,xAxisEnd])
                .rangeRound([0,settings.width]);
                x.nice(d3.timeWeek,1);

        var histogram = d3.histogram()
                .value(function(d){return d.date;})
                .domain(x.domain())
                .thresholds(x.ticks(d3.timeWeek));
        
        var bins = histogram(data);

        
        var y = d3.scaleLinear()
                .range([settings.height, 0])
                .domain([0, settings.boxesStacked || d3.max(bins, function(d){ return d.length;})]);
        
        var xAxis = d3.axisBottom(x)
                .ticks(d3.timeWeek.every(1))
                .tickFormat(d3.timeFormat("%d %b %y"));
        
        svg.append("g")
                .attr("transform", "translate(0," + settings.height + ")")
                .call(xAxis);
        
        var bar = svg.selectAll("bar")
                .data(bins)
                .enter()
                .append("g")
                .attr("class","bar")
                .attr("transform", function(d){ return "translate(" + x(d.x0) + "," + y(d.length) + ")";});
        
        var box = bar.selectAll("system")
                .data(function(d){ return d.map(mapData);})
                .enter();
        box     .append("rect")
                .attr("x",1)
                .attr("y", function(d, i) { return settings.height - y(i); })
                .attr("stroke","black")
                .attr("fill",settings.boxColour)
                .attr("width", function(d) {return x(d.x1) - x(d.x0); })
                .attr("height", function(d) { return settings.height - y(1); })
                .on("mouseover", handleMouseOver);
                
        box     .append("circle")
                .attr("r",5)
                .attr("cx",15)
                .attr("cy", function(d, i) { return settings.height - y(i) + ((settings.height - y(1)) /2); })
                .attr("stroke","black")
                .attr("fill", function (d) {
                    var difference = d["man minutes"].remaining - (d.date.getTime() - Date.now()) / (1000*60);
                        return color(difference);
                    });
        
        bar.selectAll("label")
                .data(function(d){ return d.map(mapData);})
                .enter()
                .append("text")
                .attr("dy",".7em")
                .attr("y", function(d, i) { return settings.height - y(i) + (settings.height - y(1))/2; })
                .attr("x", function(d) { return (x(d.x1) - x(d.x0)) / 2; })
                .attr("text-anchor", "middle")
                .attr("fill",settings.boxTextColour)
                .attr("font",settings.boxFont)
                .text(function(d) { return d.name; });
        
        
        function handleMouseOver(d){
            key.html(settings.keyFormat(d));
        }
        
        function mapData(current,index, original){
            current.x1 = original.x1;
            current.x0 = original.x0;
            return current;
        }
        
        function toURI(){
            return "data:image/svg+xml;charset=utf-8,"+(new XMLSerializer).serializeToString(document.querySelector(dom + ' > #skylineSVG'));
        }
        
        function toCanvas(){
            var canvas = document.createElement("canvas");
            var context = canvas.getContext('2d');
            var img = new Image();
                img.onload = function(){
                    context.drawImage(img, 0 ,0);
                };
            img.src = toURI();
            return canvas;
        }
        
        return {
            toCanvas:toCanvas,
            toUri:toURI
        };
    };
}(window.d3));
