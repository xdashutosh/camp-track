import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import api from '../lib/api';
import { Loader2, ZoomIn, ZoomOut, Maximize, X, Phone, User as UserIcon, Star, Plus, Minus, Users } from 'lucide-react';

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
    hasOriginalChildren?: boolean;
}

const getNodeColor = (type: string, zoneColor?: string) => {
    if (zoneColor && (type === 'zone' || type === 'mandal' || type === 'booth')) {
        return zoneColor;
    }
    switch (type) {
        case 'root': return '#4F46E5'; // Indigo
        case 'constituency': return '#6366F1'; // Indigo-500
        case 'zone': return '#10B981'; // Green
        case 'mandal': return '#F59E0B'; // Amber
        case 'booth': return '#94A3B8'; // Slate
        default: return '#CBD5E1';
    }
};

export const OrgChartPage = () => {
    const [data, setData] = useState<HierarchyNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeNode, setActiveNode] = useState<any | null>(null);
    const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

    const wrapperRef = useRef<HTMLDivElement>(null);
    const zoomBehavior = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
    const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/admin/hierarchy');
                // Flag all nodes that natively have children so we can render collapse buttons accurately
                const flagChildren = (n: HierarchyNode) => {
                    if (n.children && n.children.length > 0) {
                        n.hasOriginalChildren = true;
                        n.children.forEach(flagChildren);
                    }
                    return n;
                };
                if (response.data) {
                    setData(flagChildren(response.data));
                }
            } catch (error) {
                console.error('Failed to fetch hierarchy', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (wrapperRef.current && !zoomBehavior.current) {
            zoomBehavior.current = d3.zoom()
                .scaleExtent([0.1, 4])
                .on('zoom', (e: any) => {
                    setTransform(e.transform);
                });
            
            d3.select(wrapperRef.current as Element).call(zoomBehavior.current as any);
        }
    }, [data]);

    // Perform fit once data is loaded and wrapper has rect sizes
    useEffect(() => {
        if (data && wrapperRef.current && zoomBehavior.current) {
            const { width } = wrapperRef.current.getBoundingClientRect();
            // Center the "constituency" (level 1) which is at y=160
            const initialTransform = d3.zoomIdentity.translate(width / 2, 80).scale(0.8);
            d3.select(wrapperRef.current as Element).call(zoomBehavior.current.transform as any, initialTransform);
        }
    }, [data]);

    const handleZoomIn = () => {
        if (wrapperRef.current && zoomBehavior.current) {
            d3.select(wrapperRef.current as Element).transition().duration(200).call(zoomBehavior.current.scaleBy as any, 1.2);
        }
    };
    const handleZoomOut = () => {
        if (wrapperRef.current && zoomBehavior.current) {
            d3.select(wrapperRef.current as Element).transition().duration(200).call(zoomBehavior.current.scaleBy as any, 0.8);
        }
    };
    const handleFit = () => {
        if (wrapperRef.current && zoomBehavior.current) {
            const { width } = wrapperRef.current.getBoundingClientRect();
            const initialTransform = d3.zoomIdentity.translate(width / 2, 80).scale(0.8);
            d3.select(wrapperRef.current as Element).transition().duration(400).call(zoomBehavior.current.transform as any, initialTransform);
        }
    };

    const toggleCollapse = (nodeId: string) => {
        setCollapsedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    // --- Generate Mind Map Layout ---
    const { nodes, links } = useMemo(() => {
        if (!data) return { nodes: [], links: [] };

        const allNodes: any[] = [];
        const allLinks: any[] = [];

        // Apply dynamically collapsed states
        const applyCollapse = (node: HierarchyNode): HierarchyNode => ({
            ...node,
            children: collapsedNodes[node.id] ? undefined : node.children?.map(applyCollapse)
        });

        const rootData = applyCollapse(data);
        const level1Data = rootData.children?.[0];

        if (!level1Data) {
            allNodes.push({ data: rootData, x: 0, y: 0, isRoot: true, isLeft: false });
            return { nodes: allNodes, links: [] };
        }

        const children = level1Data.children || [];
        // Split children: even to right, odd to left
        const rightKids = children.filter((_, i) => i % 2 === 0);
        const leftKids = children.filter((_, i) => i % 2 === 1);

        // Calculate custom tree geometries
        const verticalSpacing = 180;   // Height gap between siblings
        const horizontalSpacing = 320; // Width gap between levels

        const treeLayout = d3.tree().nodeSize([verticalSpacing, horizontalSpacing]);

        const processTree = (kids: HierarchyNode[], isLeft: boolean) => {
            if (kids.length === 0) return;
            const pseudoRoot = d3.hierarchy<any>({ ...level1Data, id: `pseudo_${isLeft}`, children: kids });
            treeLayout(pseudoRoot);
            
            pseudoRoot.each((d: any) => {
                if (d.depth === 0) return; // skip pseudo root
                
                // d.y is depth (horizontal distance), d.x is breadth (vertical list)
                const nx = isLeft ? -d.y : d.y; 
                const ny = d.x + 160; // Offset Y because Level 1 is rendered at Y=160

                allNodes.push({ data: d.data, x: nx, y: ny, isLeft });

                // Add link
                const isFirstLevel = d.depth === 1;
                const srcX = isFirstLevel ? 0 : (isLeft ? -d.parent!.y : d.parent!.y);
                const srcY = isFirstLevel ? 160 : d.parent!.x + 160;

                allLinks.push({
                    source: { x: srcX, y: srcY, isLeft },
                    target: { x: nx, y: ny, isLeft },
                    isRootLink: false
                });
            });
        };

        processTree(rightKids, false);
        processTree(leftKids, true);

        // Add Root and Level 1
        allNodes.push({ data: rootData, x: 0, y: 0, isRoot: true, isLeft: false });
        allNodes.push({ data: level1Data, x: 0, y: 160, isLevel1: true, isLeft: false });
        
        allLinks.push({
            source: { x: 0, y: 0 },
            target: { x: 0, y: 160 },
            isRootLink: true
        });

        return { nodes: allNodes, links: allLinks };
    }, [data, collapsedNodes]);

    return (
        <div className="w-full h-screen bg-slate-50 relative overflow-hidden" ref={wrapperRef}>
            {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50 z-50">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p className="font-medium text-slate-600">Building Mind Map Hierarchy...</p>
                </div>
            ) : (
                <>
                    {/* Controls */}
                    <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
                        <button
                            onClick={handleFit}
                            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-lg hover:shadow-xl active:scale-95"
                            title="Center Tree"
                        >
                            <Maximize className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col border border-slate-200 rounded-2xl bg-white shadow-lg overflow-hidden">
                            <button
                                onClick={handleZoomIn}
                                className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-slate-50 border-b border-slate-200 transition-all active:scale-95"
                            >
                                <ZoomIn className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleZoomOut}
                                className="w-12 h-12 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                <ZoomOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 z-10 bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-3 rounded-xl shadow-sm pointer-events-none">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campaign System</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">Bidirectional Organization Hierarchy</p>
                    </div>

                    {/* D3 Canvas container */}
                    <div 
                        className="w-full h-full cursor-grab active:cursor-grabbing origin-top-left will-change-transform"
                        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
                    >
                        {/* 1. Draw Links SVG over the entire plane */}
                        <svg className="absolute overflow-visible pointer-events-none z-0" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
                            {links.map((link, i) => {
                                const { source, target, isRootLink } = link;
                                // Simple line for root connection vertically
                                if (isRootLink) {
                                    return (
                                        <line 
                                            key={`link-${i}`} 
                                            x1={source.x} y1={source.y + 60} 
                                            x2={target.x} y2={target.y - 60} 
                                            stroke="#CBD5E1" strokeWidth="2.5" 
                                        />
                                    );
                                }
                                
                                // Bezier curves for branches
                                // Ensure paths start from the correct side of the parent card
                                const sx = source.isLeft ? source.x - 110 : source.x + 110; 
                                const sy = source.y;
                                const tx = target.isLeft ? target.x + 110 : target.x - 110;
                                const ty = target.y;

                                // If source is the Level 1 trunk, draw from strictly its left/right edge
                                const effectiveSx = source.x === 0 ? (target.isLeft ? -110 : 110) : sx;

                                const midX = effectiveSx + (tx - effectiveSx) / 2;
                                const path = `M ${effectiveSx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
                                
                                return <path key={`link-${i}`} d={path} fill="none" stroke="#E2E8F0" strokeWidth="2.5" />;
                            })}
                        </svg>

                        {/* 2. Render absolute positioned HTML nodes */}
                        <div className="absolute left-0 top-0 z-10 w-full h-full">
                            {nodes.map((n) => {
                                const { data: d, x, y, isLeft } = n;
                                const isStaffLevel = d.type !== 'root' && d.type !== 'constituency';
                                const workers = d.assigned_workers || [];
                                const mainWorker = workers.find((w: any) => w.is_president) || workers[0];
                                const remainingCount = mainWorker ? workers.length - 1 : 0;
                                const color = getNodeColor(d.type, d.color);
                                const isCollapsed = !!collapsedNodes[d.id];
                                
                                return (
                                    <div 
                                        key={d.id}
                                        onClick={() => isStaffLevel && setActiveNode(d)}
                                        className={`absolute bg-white rounded-xl shadow-md border ${isStaffLevel ? 'cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all border-slate-200' : 'border-indigo-100'}`}
                                        style={{ 
                                            left: x - 110, // Center horizontal
                                            top: y - 60,   // Center vertical
                                            width: 220, 
                                            height: 120 
                                        }}
                                    >
                                        <div style={{ backgroundColor: color }} className="h-1.5 rounded-t-xl w-full" />
                                        <div className="p-3.5 flex flex-col h-[114px]">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-wider">{d.type}</div>
                                            <div className="text-[15px] text-slate-900 font-black truncate">{d.name}</div>
                                            
                                            {isStaffLevel && (
                                                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 pb-0">
                                                    {mainWorker ? (
                                                        <div className="flex items-center gap-2 min-w-0 pr-1">
                                                            <div className="w-7 h-7 shrink-0 rounded-full bg-slate-100 overflow-hidden relative shadow-sm border border-slate-200">
                                                                {mainWorker.image_url ? (
                                                                    <img src={mainWorker.image_url} className="w-full h-full object-cover" alt="Profile" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                                        {mainWorker.name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0 leading-none">
                                                                <span className="text-[11px] font-bold text-slate-700 truncate">{mainWorker.name}</span>
                                                                {remainingCount > 0 && <span className="text-[9px] text-slate-400 font-bold mt-1">+{remainingCount} more assigned</span>}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-slate-400 font-medium italic py-1">No field staff assigned</div>
                                                    )}
                                                    
                                                </div>
                                            )}
                                        </div>

                                        {/* Expand/Collapse Buttons */}
                                        {d.hasOriginalChildren && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleCollapse(d.id); }}
                                                className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors z-20 text-slate-500 ${isLeft ? '-left-3' : '-right-3'}`}
                                                title={isCollapsed ? 'Expand Children' : 'Collapse Children'}
                                            >
                                                {isCollapsed ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Worker Details Modal */}
                    {activeNode && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveNode(null)}>
                            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeNode.type} Details</h3>
                                        <h2 className="text-xl font-bold text-slate-900 mt-1">{activeNode.name}</h2>
                                    </div>
                                    <button onClick={() => setActiveNode(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6 max-h-[60vh] overflow-y-auto">
                                    <div className="space-y-3">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2">Assigned Staff ({activeNode.assigned_workers?.length || 0})</h4>
                                        {activeNode.assigned_workers && activeNode.assigned_workers.length > 0 ? (
                                            activeNode.assigned_workers.map((worker: any) => (
                                                <div key={worker.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                                                    <div className="relative">
                                                        {worker.image_url ? (
                                                            <img src={worker.image_url} alt={worker.name} className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-50" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm border border-indigo-100">
                                                                {worker.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        {worker.is_president && (
                                                            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-md tooltip" title="President">
                                                                <Star className="w-3 h-3 fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="font-bold text-slate-900 truncate pr-2">{worker.name}</h5>
                                                            {worker.is_president && (
                                                                <span className="shrink-0 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">President</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                                {worker.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <UserIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-500 text-sm font-medium">No workers are actively designated here.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    <button onClick={() => setActiveNode(null)} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30">
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
