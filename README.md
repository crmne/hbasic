HBasic
=======
Browse HBase through Apache Knox.

A simple demo application that leverages KnoxSSO service and SSOCookie provider to authenticate once and use the SSO cookie for subsequent requests.

Requires python for the SimpleHTTPServer (or you can use another web server).

1. Clone or checkout this project.
2. Execute `python -m SimpleHTTPServer 8000` or deploy the html and js files to your webserver
3. Navigate to http://localhost:8000/?topology=localhost:8443/gateway/sandbox/

Login Details and Link
========
The login link in index.html is pointing to the KnoxSSO topology and indicating that the target URL (originalURL) is this application itself. This is an effective way to leverage the SP initiated authentication through a login link.

https://localhost:8443/gateway/knoxsso/api/v1/websso?originalUrl=http://localhost:8000?topology=localhost:8443/gateway/sandbox&path=/

It also provides a query parameter for the knoxplorer application that indicates the topology to use as the endpoint for Hadoop cluster access and is currently hardcoded to "sandbox".

Note that the hostnames may need to be changed depending on the browser you are using and/or the SSO IdP that you are using. For instance:

1. Chrome does not like localhost for cookies which are required for KnoxSSO and many SSO IdPs
2. Okta does not like 127.0.0.1 for the callback URL

For situations like this I have added a phoney domain to /etc/hosts to represent my local machine: "localhost" this has worked for me.

*NOTE:* ALL of the URLs in this application and topology examples reference localhost as the localhost machine.

Apache Knox Configuration
========

## KnoxSSO Topology:

In order for the Login Link above to work, we need to have a configured KnoxSSO topology in the Knox Gateway instance that we are point to. Below is an example that leverages an Okta application for SSO:

```
      <topology>
          <gateway>
              <provider>
                  <role>webappsec</role>
                  <name>WebAppSec</name>
                  <enabled>true</enabled>
                  <param><name>xframe.options.enabled</name><value>true</value></param>
              </provider>

              <provider>
                  <role>authentication</role>
                  <name>ShiroProvider</name>
                  <enabled>true</enabled>
                  <param>
                      <name>sessionTimeout</name>
                      <value>30</value>
                  </param>
                  <param>
                      <name>redirectToUrl</name>
                      <value>/gateway/knoxsso/knoxauth/login.html</value>
                  </param>
                  <param>
                      <name>restrictedCookies</name>
                      <value>rememberme,WWW-Authenticate</value>
                  </param>
                  <param>
                      <name>main.ldapRealm</name>
                      <value>org.apache.hadoop.gateway.shirorealm.KnoxLdapRealm</value>
                  </param>
                  <param>
                      <name>main.ldapContextFactory</name>
                      <value>org.apache.hadoop.gateway.shirorealm.KnoxLdapContextFactory</value>
                  </param>
                  <param>
                      <name>main.ldapRealm.contextFactory</name>
                      <value>$ldapContextFactory</value>
                  </param>
                  <param>
                      <name>main.ldapRealm.userDnTemplate</name>
                      <value>uid={0},ou=people,dc=hadoop,dc=apache,dc=org</value>
                  </param>
                  <param>
                      <name>main.ldapRealm.contextFactory.url</name>
                      <value>ldap://localhost:33389</value>
                  </param>
                  <param>
                      <name>main.ldapRealm.authenticationCachingEnabled</name>
                      <value>false</value>
                  </param>
                  <param>
                      <name>main.ldapRealm.contextFactory.authenticationMechanism</name>
                      <value>simple</value>
                  </param>
                  <param>
                      <name>urls./**</name>
                      <value>authcBasic</value>
                  </param>
              </provider>
              <provider>
                  <role>identity-assertion</role>
                  <name>Default</name>
                  <enabled>true</enabled>
              </provider>
          </gateway>

          <application>
            <name>knoxauth</name>
          </application>

          <service>
              <role>KNOXSSO</role>
              <param>
                  <name>knoxsso.cookie.secure.only</name>
                  <value>true</value>
              </param>
              <param>
                  <name>knoxsso.token.ttl</name>
                  <value>30000</value>
              </param>
              <param>
                 <name>knoxsso.redirect.whitelist.regex</name>
                 <value>.*</value>
              </param>
          </service>

      </topology>
```

Please note the knoxsso.redirect.whitelist.regex parameter in the KNOXSSO service. This is a semicolon separated list of regex expressions that will be used to validate the originalUrl query parameter to ensure that KnoxSSO will only redirect browsers to trusted sites. This is to avoid things like phishing attacks. In this case we enabled access to all sites for testing purposes. Make sure to change it to match your domain name.

## Sandbox Topology:
The topology that defines the endpoint used to actually access Hadoop resources through the Apache Gateway in this deployment is called sandbox.xml. The following configuration assumes the use of the Hortonworks sandbox VM based Hadoop cluster to enable quick deployment and getting started with Hadoop and app development.

In order to leverage the single sign on capabilities described earlier, this topology much configure the SSOCookie federation provider. This essentially means that the SSO cookie is required in order to access any of the Hadoop endpoints configured within this topology.

```
<topology>
    <gateway>
        <provider>
            <role>federation</role>
            <name>SSOCookieProvider</name>
            <enabled>true</enabled>
            <param>
                <name>sso.authentication.provider.url</name>
                <value>https://localhost:8443/gateway/knoxsso/api/v1/websso</value>
            </param>
        </provider>

        <provider>
            <role>identity-assertion</role>
            <name>Default</name>
            <enabled>true</enabled>
        </provider>

        <provider>
            <role>authorization</role>
            <name>XASecurePDPKnox</name>
            <enabled>true</enabled>
        </provider>

    </gateway>

    <service>
        <role>NAMENODE</role>
        <url>hdfs://localhost:8020</url>
    </service>

    <service>
        <role>JOBTRACKER</role>
        <url>rpc://localhost:8050</url>
    </service>

    <service>
        <role>WEBHDFS</role>
        <url>http://localhost:50070/webhdfs</url>

    </service>

    <service>
        <role>WEBHCAT</role>
        <url>http://localhost:50111/templeton</url>
    </service>

    <service>
        <role>OOZIE</role>
        <url>http://None:11000/oozie</url>
    </service>

    <service>
        <role>WEBHBASE</role>
        <url>http://localhost:60080</url>
    </service>

    <service>
        <role>HIVE</role>
        <url>http://localhost:10001/cliservice</url>
    </service>

    <service>
        <role>RESOURCEMANAGER</role>
        <url>http://localhost:8088/ws</url>
    </service>
</topology>
```

You can see that CORS must be enabled for the browser to allow REST API calls from javascript to an endpoint other than the one used to serve this application and to present the cookie as a credential. Therefore, the WebAppSec provider is configured and setup to enable CORS.

Also note that there is no need to do principal mapping in this topology. That is because we did that in the KnoxSSO topology which results in the identity within the token to be the mapped or effective principal. We could also move that principal mapping to each topology that may want map the same IdP identity to different users. This is left up to the admin.

Troubleshooting
=======

The most likely trouble that you will run into will be related to cookies and domains. Make sure that the domains that you are using for each configured URL are the same and are acceptable to your IdP and browser.

Another issue that might crop up would be the secureOnly flag on the cookie - if you are not running Apache Knox with SSL enabled (shame on you) then this flag must not be set. See the KnoxSSO topology and service for setting that to false.

If authentication seems to be successful but there is no listing rendered. Ensure that there is a principal mapping for the username being asserted to the WebHBase service. Check the audit log for the username being used and map it to "guest" as necessary.
