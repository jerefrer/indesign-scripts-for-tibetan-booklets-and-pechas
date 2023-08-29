/*******************************************************************************

        Name:           ProgressBar
        Desc:           Simple progress bar.
        Path:           /inc/progress.lib.jsxinc
        Require:        ---
        Encoding:       ÛȚF8
        Kind:           Constructor
        API:            show()=reset() msg() hit() hitValue() hide() close()
        DOM-access:     NO (ScriptUI)
        Todo:           Does not work in Mac El Capitan
        Created:        141112 (YYMMDD)
        Modified:       160228 (YYMMDD)

*******************************************************************************/

$.hasOwnProperty('ProgressBar')||(function(H/*OST*/,S/*ELF*/,I/*NNER*/)
{
    H[S] = function ProgressBar(/*str*/title,/*uint*/width,/*uint*/height)
    {
        (60<=(width||0))||(width=340);  
        (40<=(height||0))||(height=60);  
      
        var H = 22,  
            Y = (3*height-2*H)>>2,  
            W = new Window('palette', ' '+title, [0,0,width,height]),  
            P = W.add('progressbar', { x:20, y:height>>2, width:width-40, height:12 }, 0,100),  
            T = W.add('statictext' , { x:0, y:Y, width:width, height:H }),  
            __ = function(a,b){ return localize.apply(null,a.concat(b)) };  
      
        this.pattern = ['%1'];  
      
        W.center();  
      
        // ---  
        // API  
        // ---  
         
        this.msg = function(/*str*/s,  v)  
        // ---------------------------------  
        {  
            s && (T.location = [(width-T.graphics.measureString(s)[0])>>1, Y]);  
            
            T.text = s;
            W.update();
        };  
      
        this.show = this.reset = function(/*str*/s, /*uint*/v)  
        // ---------------------------------  
        {  
            if( s && s != localize(s,1,2,3,4,5,6,7,8,9) )  
                {  
                this.pattern[0] = s;  
                s = __(this.pattern, [].slice.call(arguments,2));  
                }  
            else  
                {  
                this.pattern[0] = '%1';  
                }  
             
            P.value = 0;  
            P.maxvalue = v||0;  
            P.visible = !!v;  
      
            this.msg(s);  
            
            W.show();
            W.update();
        };  
      
        this.hit = function(x)  
        // ---------------------------------  
        {  
            ++P.value;  
            ('undefined' != typeof x) && this.msg(__(this.pattern, [].slice.call(arguments,0)));
            W.update();
        };

        this.hitValue = function(v,x)
        // ---------------------------------  
        {  
            P.value = v;
            ('undefined' != typeof x) && this.msg(__(this.pattern, [].slice.call(arguments,1)));
            W.update();
        };

        this.hide = function()  
        // ---------------------------------  
        {  
            W.hide();  
        };  
         
        this.close = function()  
        // ---------------------------------  
        {  
            W.close();  
        };  
    };

})($,{toString:function(){return 'ProgressBar'}},{});
