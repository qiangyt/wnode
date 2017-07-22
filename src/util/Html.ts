export default class Html {

    static filterAnchorTag( html:string ) {
        return html.replace(/<a[^>]*>(.*)<\/a>/ig, '$1' );
    }

    static normalizeImageTag( html:string ) {
        return html.replace( /<img.+?src="(.+?)".+?>/ig, '<img src="$1" />' );
    }

    /**
     * 提取出HTML文本里的img分段
     * @param  html:string HTML文本
     * @return string[] img分段的数组
     */
    static extractImg( html:string ) {
        const result = html.match(/<img\s.*?>/gi);
        return result ? result : [];
    }

    /**
     * 提取出HTML文本里的img的src属性
     * 
     * @param  html:string HTML文本
     * @param opts 选项。可用选项: allowLocalFile 是否允许src是本地文件
     * 
     * @return string[] src的数组
     */
    static extractImgSrc( html:string, opts:any ) {
        const result = [];
        const allowLocalFile = (opts && opts.allowLocalFile);
        
        const imgs = Html.extractImg(html);
        for( let img of imgs ) {
            //提取出所有的属性 
            const srcExpr = img.match(/src\s*=\s*["'][\S]*["']/gi);
            if( !srcExpr ) continue;
            const srcStr = srcExpr[0].substring(3).match(/\s*["'][\S]*["']/gi)[0].trim();
            const src = srcStr.substring( 1, srcStr.length - 1 );
            if( !allowLocalFile && src.toLowerCase().startsWith('file://') ) continue;
            result.push(src);
        }

        return result;
    }
        
}
