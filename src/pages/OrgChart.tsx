import { useState, useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';
import api from '../lib/api';
import { Loader2, ZoomIn, ZoomOut, Maximize, X, Phone, User, Star } from 'lucide-react';

interface Worker {
    id: string;
    name: string;
    image_url?: string;
    phone: string;
    is_president?: boolean;
}

interface HierarchyNode {
    id: string;
    parentId: string | null;
    name: string;
    type: string;
    color?: string;
    assigned_workers?: Worker[];
    children?: HierarchyNode[];
}

export const OrgChartPage = () => {
    const d3Container = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<HierarchyNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeNode, setActiveNode] = useState<any | null>(null);
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
                .nodeHeight(() => 120)
                .onNodeClick((d: any) => {
                    if (d.data.type === 'root' || d.data.type === 'constituency') return;
                    setActiveNode(d.data);
                })
                .childrenMargin(() => 50)
                .compactMarginBetween(() => 25)
                .compactMarginPair(() => 50)
                .nodeContent((d: any) => {
                    const color = getNodeColor(d.data.type, d.data.color);
                    const isStaffLevel = d.data.type !== 'root' && d.data.type !== 'constituency';
                    const workers = d.data.assigned_workers || [];
                    const displayWorkers = workers.slice(0, 3);
                    const extraCount = workers.length > 3 ? workers.length - 3 : 0;

                    return `
            <div style="background-color:white; position:absolute; width:${d.width}px; height:${d.height}px; border-radius:12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); cursor: ${isStaffLevel ? 'pointer' : 'default'};">
               <div style="background-color:${color}; height:6px; border-radius:12px 12px 0 0;"></div>
               <div style="padding:12px;">
                 <div style="color:#64748B; font-size:10px; text-transform:uppercase; font-weight:700; margin-bottom:4px;">${d.data.type}</div>
                 <div style="color:#1E293B; font-size:14px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.data.name}</div>
                 
                 ${isStaffLevel ? `
                 <div style="margin-top:12px; display:flex; align-items:center; justify-content:space-between;">
                    ${workers.length > 0 ? `
                    <div style="display:flex; align-items:center; -space-x-2;">
                        ${displayWorkers.map((w: any, idx: number) => `
                            <div style="width:28px; height:28px; border-radius:50%; border:2px solid white; background-color:#F1F5F9; overflow:hidden; margin-left:${idx === 0 ? '0' : '-8px'}; z-index:${10 - idx};">
                                ${w.image_url ? 
                                    `<img src="${w.image_url}" style="width:100%; height:100%; object-fit:cover;" />` : 
                                    `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#6366F1; font-size:10px; font-weight:700;">${w.name.charAt(0)}</div>`
                                }
                            </div>
                        `).join('')}
                        ${extraCount > 0 ? `
                            <div style="width:28px; height:28px; border-radius:50%; border:2px solid white; background-color:#E2E8F0; display:flex; align-items:center; justify-content:center; margin-left:-8px; z-index:1; font-size:8px; font-weight:800; color:#64748B;">+${extraCount}</div>
                        ` : ''}
                    </div>
                    ` : `
                    <div style="color:#94A3B8; font-size:10px; font-style:italic;">No workers assigned</div>
                    `}
                    
                    <div style="color:#6366F1; font-size:10px; font-weight:600; background-color:#EEF2FF; padding:2px 6px; rounded-md; border-radius:4px;">View Details</div>
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
            assigned_workers: node.assigned_workers || []
        }];
        if (node.children) {
            node.children.forEach(child => {
                flattened = flattened.concat(flattenData(child, node.id));
            });
        }
        return flattened;
    };

    const getNodeColor = (type: string, zoneColor?: string) => {
        if (zoneColor && (type === 'zone' || type === 'mandal' || type === 'booth')) {
            return zoneColor;
        }
        switch (type) {
            case 'root': return '#4F46E5'; // Indigo
            case 'constituency': return '#6366F1'; // Indigo-500
            case 'zone': return '#10B981'; // Green fallback
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

                    {/* Worker Details Modal */}
                    {activeNode && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveNode(null)}>
                            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{activeNode.type} Details</h3>
                                        <h2 className="text-xl font-bold text-slate-900">{activeNode.name}</h2>
                                    </div>
                                    <button onClick={() => setActiveNode(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase ml-1">Assigned Workers ({activeNode.assigned_workers?.length || 0})</h4>
                                        {activeNode.assigned_workers && activeNode.assigned_workers.length > 0 ? (
                                            activeNode.assigned_workers.map((worker: any) => (
                                                <div key={worker.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                                    <div className="relative">
                                                        {worker.image_url ? (
                                                            <img src={worker.image_url} alt={worker.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-white shadow-sm">
                                                                {worker.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        {worker.is_president && (
                                                            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-sm" title="President">
                                                                <Star className="w-3 h-3 fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900">{worker.name}</span>
                                                            {worker.is_president && (
                                                                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-md uppercase">President</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="w-3.5 h-3.5" />
                                                                <span>{worker.phone}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-3.5 h-3.5" />
                                                                <span>Worker ID: {worker.id.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-400 text-sm italic">No field staff assigned to this unit.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    <button onClick={() => setActiveNode(null)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
