package com.myorg;

import software.amazon.awscdk.core.App;

public final class NowtvCfApp {
    public static void main(final String[] args) {
        App app = new App();

        new NowtvCfStack(app, "NowtvCfNew");

        app.synth();
    }
}
