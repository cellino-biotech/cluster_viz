// @author Jason Natale

const zMult = -15;
const slopeThresh = -0.6;


/**
 * Build out cluster lineage graph with Darwin data
 */
function build_cluster_graph(graph, darwinJSON) {
  // Read Darwin JSON data
  var data = JSON.parse(darwinJSON);

  // Create a black origin node with cartesian coordinates x=0, y=0, z=0
  var originNode = G.node([0, 0, 0], {color: "black"});
  graph.addNode(originNode);

  // first pass over data create all nodes
  for (const clusterId of Object.keys(data)) {
    var cluster = data[clusterId];
    // convert frame_idxs to integers and sort
    var frame_idxs = (Object.keys(cluster['artifacts'])).map(function(e, i) {
      return parseInt(e);
    });
    frame_idxs.sort(function(a, b) {
      return a - b;
    });
    
    // initialize nodes for cluster
    data[clusterId]['nodes'] = [];

    for (const frame_idx of frame_idxs) {
      let x = cluster['artifacts'][frame_idx.toString()][0];
      let y = cluster['artifacts'][frame_idx.toString()][1];
      let z = frame_idx * zMult;
      let color = "green";
      var node = G.node([x, y, z], {color: color}).addTo(graph);
      data[clusterId]['nodes'].push(node);
      // add an intra-cluster edge if relevant
      var numArtifacts = data[clusterId]['nodes'].length;
      if (numArtifacts >= 2) {
        for (var i = 1; i < numArtifacts; i++) {
	  var srcNode = data[clusterId]['nodes'][i-1];
	  var dstNode = data[clusterId]['nodes'][i];
	  draw_edge(clusterId, srcNode, clusterId, dstNode);
	}
      }
    }
  }

  console.log('creating inter-cluster edges');
  // second pass over data create all inter-cluster edges
  for (const clusterId of Object.keys(data)) {
    var parents = data[clusterId]['parents'];
    var parentsLen = parents.length;
    for (var i = 0; i < parentsLen; i++) {
      var srcClusterId = parents[i];
      if (data[srcClusterId] == undefined) {
        console.log('srcClusterId '+srcClusterId+' referenced but no node exists');
	continue;
      }
      var srcNodesLength = data[srcClusterId]['nodes'].length;
      var srcNode = data[srcClusterId]['nodes'][srcNodesLength - 1];
      if (data[clusterId] == undefined) {
        console.log('clusterId '+clusterId+' referenced but no node exists');
	continue;
      }
      var dstNode = data[clusterId]['nodes'][0];
      draw_edge(srcClusterId, srcNode, clusterId, dstNode);
    }
  }
}


/*
 * Draw Edge color based on slope, and alert if slope below threshold,
 * because that indicates an issue with our annotation (or prediction in future)
 */
function draw_edge(srcClusterId, srcNode, dstClusterId, dstNode) {
  // clusters info
  let clusters = srcClusterId;
  if (srcClusterId != dstClusterId) {
    clusters = [srcClusterId, dstClusterId];
  }

  // get slope, and if it's greater than slopeThresh make it red and emit warning
  let xdiff = srcNode['_pos']['x'] - dstNode['_pos']['x'];
  let ydiff = srcNode['_pos']['y'] - dstNode['_pos']['y'];
  let denom = Math.sqrt(Math.pow(xdiff, 2) + Math.pow(ydiff, 2));
  let zdiff = dstNode['_pos']['z'] - srcNode['_pos']['z'];
  // zdiff should be negative, as the z values should be descending 
  if (zdiff > 0) {
    console.log('out of order lineage over span of '+(zdiff/zMult)+' frames at cluster(s) '+clusters);
  }
  let slope = zdiff / denom;
  if (slope > slopeThresh) {
    let dstFrameNum = (dstNode['_pos']['z'] / zMult) + 1;
    let srcFrameNum = (srcNode['_pos']['z'] / zMult) + 1;
    
    // formatting alert
    console.log("low slope in cluster(s) "+clusters+" between frames "+
	      srcFrameNum+" and "+dstFrameNum);
    var edge = G.edge([srcNode, dstNode], {color: 'red'}).addTo(graph);
  } else {
    var edge = G.edge([srcNode, dstNode], {color: 'blue'}).addTo(graph);
  }
}

