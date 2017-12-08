using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ArcGIS.Core.Geometry;
using ArcGIS.Core.Internal;
using ArcGIS.Desktop.Mapping;
using ArcGIS.Desktop.Framework.Dialogs;
using ArcGIS.Desktop.Framework.Threading.Tasks;
using Geometry = ArcGIS.Core.Geometry.Geometry;
using Polyline = ArcGIS.Core.Geometry.Polyline;
using QueryFilter = ArcGIS.Core.Data.QueryFilter;

namespace RangeFinder
{
    internal class RangeFinder2000 : MapTool
    {
        private readonly string[] _leftsTos = {"TO_LEFT", "LEFT_TO", "TOADDR_L", "L_T_ADD"};
        private readonly string[] _leftsFroms = {"FROM_LEFT", "LEFT_FROM", "FROMADDR_L", "L_F_ADD"};
        private readonly string[] _rightTos = {"RIGHT_TO", "TO_RIGHT", "TOADDR_R", "R_T_ADD"};
        private readonly string[] _rightFroms = {"RIGHT_FROM", "FROM_RIGHT", "FROMADDR_R", "R_F_ADD"};

        public RangeFinder2000()
        {
            IsSketchTool = true;
            SketchType = SketchGeometryType.Point;
            SketchOutputMode = SketchOutputMode.Map;
        }

        protected override Task OnToolActivateAsync(bool active)
        {
            return base.OnToolActivateAsync(active);
        }

        protected override Task<bool> OnSketchCompleteAsync(Geometry userClickGeometry)
        {
            return QueuedTask.Run(() =>
            {
                var mapView = MapView.Active;
                if (mapView == null)
                {
                    return true;
                }

                // Get all the features that intersect the sketch userClickGeometry and flash them in the view. 
                var results = mapView.GetFeatures(userClickGeometry);

                // Filter out layers that don't contain the name roads
                var selectedRoads = results.Where(x => x.Key.Name.ToLower().Contains("road"))
                                           .ToDictionary(key => key.Key, value=> value.Value);

                mapView.FlashFeature(selectedRoads);

                foreach (var kvp in selectedRoads)
                {
                    var fields = kvp.Key.GetFieldDescriptions();
                    var rangeFields = new Dictionary<string, string>
                    {
                        { "leftFrom", fields.Single(x => _leftsFroms.Contains(x.Name.ToUpper())).Name },
                        { "leftTo", fields.Single(x => _leftsTos.Contains(x.Name.ToUpper())).Name },
                        { "rightFrom", fields.Single(x => _rightFroms.Contains(x.Name.ToUpper())).Name },
                        { "rightTo", fields.Single(x => _rightTos.Contains(x.Name.ToUpper())).Name },
                    };

                    var filter = new QueryFilter
                    {
                        WhereClause = $"OBJECTID = {kvp.Value[0]}",
                        SubFields = "*"
                    };

                    using (var cursor = kvp.Key.Search(filter))
                    {
                        while (cursor.MoveNext())
                        {
                            using (var row = cursor.Current)
                            {
                                var lf = row[rangeFields["leftFrom"]];
                                var lt = row[rangeFields["leftTo"]];
                                var rf = row[rangeFields["rightFrom"]];
                                var rt = row[rangeFields["rightTo"]];

                                var shape = (Polyline)row["Shape"];

                                var point = (MapPoint)GeometryEngine.Instance.Project(userClickGeometry, shape.SpatialReference);
                                var proximity = GeometryEngine.Instance.NearestPoint(shape, point);
                                var distance = proximity.Distance * 2;

                                var vertices = new List<Coordinate2D>
                                {
                                    new Coordinate2D(point),
                                    new Coordinate2D(proximity.Point),
                                };

                                var polyline = PolylineBuilder.CreatePolyline(vertices, point.SpatialReference);

                                var extension = GeometryEngine.Instance.MovePointAlongLine(polyline, distance, false, 0,
                                    SegmentExtension.ExtendEmbedded);

                                vertices.Add(new Coordinate2D(extension));

                                polyline = PolylineBuilder.CreatePolyline(vertices, point.SpatialReference);

                                var parts = GeometryEngine.Instance.Cut(shape, polyline);
                                var totalLength = shape.Length;
                                var polylines = parts.Select(x => (Polyline)x).ToArray();

                                var template = $"Left From {lf} To {lt}\n" +
                                               $"Right From: {rf} To: {rt}\n" +
                                               $"Part one: {polylines[0].Length / totalLength:P2}\n" +
                                               $"Part two: {polylines[1].Length/totalLength:P2}\n";

                                MessageBox.Show(template, "Range Finder 2000");
                            }
                        }
                    }
                }

                return true;
            });
        }
    }
}
