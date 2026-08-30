const { withGradleProperties } = require("@expo/config-plugins");

/** Keep managed EAS/Gradle builds within a predictable memory budget. */
const withGradleConstraints = (config) =>
  withGradleProperties(config, (configMod) => {
    const properties = configMod.modResults;
    const setProperty = (key, value) => {
      const existing = properties.find((property) => property.type === "property" && property.key === key);
      if (existing && existing.type === "property") {
        existing.value = value;
      } else {
        properties.push({ type: "property", key, value });
      }
    };

    setProperty("org.gradle.jvmargs", "-Xmx1024m -XX:MaxMetaspaceSize=512m");
    setProperty("org.gradle.parallel", "false");
    setProperty("org.gradle.workers.max", "2");
    return configMod;
  });

module.exports = withGradleConstraints;
