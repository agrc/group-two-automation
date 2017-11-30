var relationships = [{
    source: 'Municipal Boundaries',
    target: 'Parcels',
    type: 'alignment'
}, {
    source: 'Parcels',
    target: 'Address Points',
    type: 'qc'
}, {
    source: 'Parcels',
    target: 'Tax',
    type: 'qc'
}, {
    source: 'Parcels',
    target: 'PLSS Fabric',
    type: 'qc'
}, {
    source: 'Parcels',
    target: 'Voting',
    type: 'alignment'
}, {
    source: 'Parcels',
    target: 'PLSS',
    type: 'data'
}, {
    source: 'Municipal Boundaries',
    target: 'Address Points',
    type: 'data'
}, {
    source: 'Municipal Boundaries',
    target: 'Tax',
    type: 'alignment'
}, {
    source: 'Municipal Boundaries',
    target: 'Political Boundaries',
    type: 'alignment'
}, {
    source: 'Municipal Boundaries',
    target: 'Enterprize Zones',
    type: 'alignment'
}, {
    source: 'Municipal Boundaries',
    target: 'E911',
    type: 'alignment'
}, {
    source: 'Address Points',
    target: 'Geocoding',
    type: 'data'
}, {
    source: 'Address Points',
    target: 'E911',
    type: 'data'
}, {
    source: 'Address Grids',
    target: 'Address Points',
    type: 'data'
}, {
    source: 'PLSS Fabric',
    target: 'Land Ownership',
    type: 'alignment'
}, {
    source: 'PLSS Fabric',
    target: 'Tax',
    type: 'alignment'
}, {
    source: 'PLSS Fabric',
    target: 'Municipal Boundaries',
    type: 'alignment'
}, {
    source: 'Roads',
    target: 'Geocoding',
    type: 'qc'
}, {
    source: 'Roads',
    target: 'E911',
    type: 'data'
}, {
    source: 'Address Grids',
    target: 'Roads',
    type: 'data'
}, {
    source: 'Roads',
    target: 'Road Network',
    type: 'data'
}, {
    source: 'Zip Codes',
    target: 'Roads',
    type: 'data'
}, {
    source: 'County Boundaries',
    target: 'Roads',
    type: 'data'
}, {
    source: 'Tax',
    target: 'Sales Tax',
    type: 'data'
},{
    source: 'Zip Codes',
    target: 'Address Points',
    type: 'qc'
}, {
    source: 'County Boundaries',
    target: 'Address Points',
    type: 'qc'
}, {
    source: 'Political Boundaries',
    target: 'Vista Ballot',
    type: 'alignment'
}, {
    source: 'Political Boundaries',
    target: 'County Boundaries',
    type: 'alignment'
}];

relationships.sort(function(a, b) {
   if (a.source > b.source) {
       return 1;
   }
   else if (a.source < b.source) {
       return -1;
   }
   else {
       if (a.target > b.target) {
           return 1;
       }
       if (a.target < b.target) {
           return -1;
       }
       else {
           return 0;
       }
   }
});

// any relationships with duplicate source and target get an incremented 'linknum'
for (var i=0; i<relationships.length; i++) {
    if (i != 0 &&
        relationships[i].source == relationships[i-1].source &&
        relationships[i].target == relationships[i-1].target) {
            relationships[i].linknum = relationships[i-1].linknum + 1;
        }
    else {
        relationships[i].linknum = 1;
    }
};

var nodes = {};

// Compute the distinct nodes from the relationships.
relationships.forEach(function(link) {
  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
});

var w = 1200,
    h = 800;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(relationships)
    .size([w, h])
    .linkDistance(125)
    .charge(-3000)
    .on('tick', tick)
    .start();

var svg = d3.select('body').append('svg:svg')
    .attr('width', w)
    .attr('height', h);

    svg.append('svg:defs').selectAll('marker')
        .data(['alignment', 'data', 'qc'])
      .enter().append('svg:marker')
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 63)
        .attr('refY', -3.5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')

      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');
    var path = svg.append('svg:g').selectAll('path')
        .data(['alignment', 'data', 'qc'])
      .enter().append('svg:path')
        .attr('class', function(d) { return 'lixnk ' + d; })
        .attr('marker-end', function(d) { return 'url(#' + d + ')'; });

// Per-type markers, as they don't inherit styles.
svg.append('svg:defs').selectAll('marker')
    .data(['alignment', 'data', 'qc'])
  .enter().append('svg:marker')
    .attr('id', String)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 63)
    .attr('refY', -3.5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

var path = svg.append('svg:g').selectAll('path')
    .data(force.links())
  .enter().append('svg:path')
    .attr('class', function(d) { return 'link ' + d.type; })
    .attr('marker-end', function(d) { return 'url(#' + d.type + ')'; });

var circle = svg.append('svg:g').selectAll('circle')
    .data(force.nodes())
  .enter().append('svg:circle')
    .attr('r', 10)
    .call(force.drag);

var text = svg.append('svg:g').selectAll('g')
    .data(force.nodes())
  .enter().append('svg:g');

// A copy of the text with a thick white stroke for legibility.
text.append('svg:text')
    .attr('x', 15)
    .attr('y', '.31em')
    .attr('class', 'shadow')
    .text(function(d) { return d.name; });

text.append('svg:text')
    .attr('x', 15)
    .attr('y', '.31em')
    .text(function(d) { return d.name; });

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  path.attr('d', function(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = 500/d.linknum;  //linknum is defined above
    return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
  });

  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });

  text.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}
