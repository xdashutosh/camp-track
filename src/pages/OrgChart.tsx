import { useState, useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import api from '../lib/api';
import { Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface HierarchyNode {
    id: string;
    parentId: string | null;
    name: string;
    type: string;
    color?: string;
    president?: string;
    children?: HierarchyNode[];
}

export const OrgChartPage = () => {
    const d3Container = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<HierarchyNode | null>(null);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef<any>(null);

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
                .nodeWidth(() => 220)
                .nodeHeight(() => 100)
                .childrenMargin(() => 50)
                .compactMarginBetween(() => 25)
                .compactMarginPair(() => 50)
                .nodeContent((d: any) => {
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

            // Auto expand all nodes for first render
            chartRef.current.expandAll().render().fit();
        }
    }, [data]);

    const flattenData = (node: HierarchyNode, parentId: string | null = null): any[] => {
        let flattened: any[] = [{
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

    const getNodeColor = (type: string, zoneColor?: string) => {
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

    return (
        <div className="w-full h-screen bg-slate-50 relative overflow-hidden">
            {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white z-50">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p className="font-medium text-slate-600">Building Organization Hierarchy...</p>
                </div>
            ) : (
                <>
                    {/* Floating Controls */}
                    <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
                        <button
                            onClick={handleFit}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-lg hover:shadow-xl active:scale-95"
                            title="Fit to Screen"
                        >
                            <Maximize className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col border border-slate-200 rounded-2xl bg-white shadow-lg overflow-hidden">
                            <button
                                onClick={handleZoomIn}
                                className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-slate-50 border-b border-slate-200 transition-all active:scale-95"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleZoomOut}
                                className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div ref={d3Container} className="w-full h-full cursor-grab active:cursor-grabbing" />

                    {/* Floating Info Badge */}
                    <div className="absolute bottom-6 left-6 z-10 bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-xl shadow-sm pointer-events-none">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campaign System</p>
                        <p className="text-sm font-bold text-slate-800">Organizational Hierarchy</p>
                    </div>
                </>
            )}
        </div>
    );
};
