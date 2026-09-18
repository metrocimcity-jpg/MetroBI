declare module "shpjs" {
    function shp(
        base: string | ArrayBuffer | {
            shp: ArrayBuffer;
            dbf?: ArrayBuffer;
            prj?: string | ArrayBuffer;
            cpg?: string | ArrayBuffer;
        }
    ): Promise<GeoJSON.FeatureCollection | GeoJSON.FeatureCollection[]>;
    export default shp;
}
