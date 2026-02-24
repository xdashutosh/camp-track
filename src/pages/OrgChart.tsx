import { useState, useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';
import api from '../lib/api';
import { Loader2, ZoomIn, ZoomOut, Maximize, Share2 } from 'lucide-react';

export const OrgChartPage = () => {
    const d3Container = useRef(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/admin/hierarchy');
                setData(response.data);
            } catch (error) {
                console.error('Failed to fetch hierarchy', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (data && d3Container.current) {
            if (!chartRef.current) {
                chartRef.current = new OrgChart();
            }

            chartRef.current
                .container(d3Container.current)
                .data(flattenData(data))
                .nodeWidth((d) => 220)
                .nodeHeight((d) => 100)
                .childrenMargin((d) => 50)
                .compactMarginBetween((d) => 25)
                .compactMarginPair((d) => 50)
                .nodeContent((d) => {
                    const color = getNodeColor(d.data.type, d.data.color);
                    return `
            <div style="background-color:white; position:absolute; width:${d.width}px; height:${d.height}px; border-radius:12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
               <div style="background-color:${color}; height:6px; border-radius:12px 12px 0 0;"></div>
               <div style="padding:12px;">
                 <div style="color:#64748B; font-size:10px; text-transform:uppercase; font-weight:700; margin-bottom:4px;">${d.data.type}</div>
                 <div style="color:#1E293B; font-size:14px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.data.name}</div>
                 ${d.data.president ? `
                 <div style="margin-top:8px; display:flex; align-items:center; gap:6px;">
                    <div style="width:20px; height:20px; background-color:#F1F5F9; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div style="color:#475569; font-size:11px; font-weight:500;">${d.data.president}</div>
                 </div>
                 ` : ''}
               </div>
            </div>
          `;
                })
                .render();
        }
    }, [data]);

    const flattenData = (node, parentId = null) => {
        let flattened = [{
            id: node.id,
            parentId: parentId,
            name: node.name,
            type: node.type,
            color: node.color,
            president: node.president
        }];
        if (node.children) {
            node.children.forEach(child => {
                flattened = flattened.concat(flattenData(child, node.id));
            });
        }
        return flattened;
    };

    const getNodeColor = (type, zoneColor) => {
        switch (type) {
            case 'root': return '#4F46E5'; // Indigo
            case 'constituency': return '#6366F1'; // Indigo-500
            case 'zone': return zoneColor || '#10B981'; // Green (or zone color)
            case 'mandal': return '#F59E0B'; // Amber
            case 'booth': return '#94A3B8'; // Slate
            default: return '#CBD5E1';
        }
    };

    const handleZoomIn = () => chartRef.current?.zoomIn();
    const handleZoomOut = () => chartRef.current?.zoomOut();
    const handleFit = () => chartRef.current?.fit();
    const handleExpandAll = () => chartRef.current?.expandAll().render();

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Campaign Organization Chart</h1>
                    <p className="text-slate-500 text-sm">Visual hierarchy of the entire election campaign system</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleFit} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm" title="Fit to screen">
                        <Maximize className="w-5 h-5" />
                    </button>
                    <div className="flex border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                        <button onClick={handleZoomOut} className="p-2.5 text-slate-600 hover:bg-slate-50 border-r border-slate-200 transition-all">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <button onClick={handleZoomIn} className="p-2.5 text-slate-600 hover:bg-slate-50 transition-all">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden shadow-inner">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p className="font-medium">Building organization chart...</p>
                    </div>
                ) : (
                    <div ref={d3Container} className="w-full h-full cursor-grab active:cursor-grabbing" />
                )}
            </div>
        </div>
    );
};
