package com.exe201.planwise.auth.oauth;

import java.util.Map;

/**
 * Google OAuth2 user info.
 * Attributes from Google userinfo endpoint:
 *   sub, name, given_name, family_name, picture, email, email_verified
 */
public class GoogleOAuth2UserInfo extends OAuth2UserInfo {

    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    @Override
    public String getId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getImageUrl() {
        return (String) attributes.get("picture");
    }
}
