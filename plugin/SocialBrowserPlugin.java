package com.ou.escaperoute;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SocialBrowser")
public class SocialBrowserPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null) { call.reject("url required"); return; }
        Intent i = new Intent(getContext(), SocialBrowserActivity.class);
        i.putExtra("url", url);
        getActivity().startActivity(i);
        call.resolve();
    }
}
