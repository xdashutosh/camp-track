declare module 'd3-org-chart' {
    export class OrgChart {
        constructor();
        container(selector: string | HTMLElement): this;
        data(data: any[]): this;
        nodeWidth(width: (node: any) => number): this;
        nodeHeight(height: (node: any) => number): this;
        childrenMargin(margin: (node: any) => number): this;
        compactMarginBetween(margin: (node: any) => number): this;
        compactMarginPair(margin: (node: any) => number): this;
        nodeContent(content: (node: any) => string): this;
        render(): this;
        expandAll(): this;
        fit(): this;
        zoomIn(): void;
        zoomOut(): void;
    }
}
