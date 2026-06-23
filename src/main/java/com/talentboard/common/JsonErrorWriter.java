package com.talentboard.common;

import java.time.Instant;

public final class JsonErrorWriter {

    private JsonErrorWriter() {
    }

    public static String build(int status, String error, String message, String path) {
        return "{\"timestamp\":\"" + Instant.now() + "\",\"status\":" + status
                + ",\"error\":\"" + escape(error) + "\",\"message\":\"" + escape(message)
                + "\",\"path\":\"" + escape(path) + "\"}";
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\"", "'");
    }
}
