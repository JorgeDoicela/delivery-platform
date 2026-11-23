using Delivery.Core.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Delivery.UnitTests.Domain;

public class DatabaseResetManagerTests
{
    [Theory]
    [InlineData("true", true)]
    [InlineData("TRUE", true)]
    [InlineData("1", true)]
    [InlineData("yes", true)]
    [InlineData("false", false)]
    [InlineData("0", false)]
    [InlineData("no", false)]
    [InlineData("", false)]
    public void IsResetOnStartupEnabled_ShouldEvaluateEnvironmentVariableCorrectly(string envValue, bool expected)
    {
        var originalEnv = Environment.GetEnvironmentVariable("RESET_DATABASE_ON_STARTUP");
        try
        {
            Environment.SetEnvironmentVariable("RESET_DATABASE_ON_STARTUP", envValue);

            var inMemoryConfig = new ConfigurationBuilder().Build();
            var result = DatabaseResetManager.IsResetOnStartupEnabled(inMemoryConfig);

            result.Should().Be(expected);
        }
        finally
        {
            Environment.SetEnvironmentVariable("RESET_DATABASE_ON_STARTUP", originalEnv);
        }
    }

    [Theory]
    [InlineData("true", true)]
    [InlineData("false", false)]
    [InlineData("1", true)]
    [InlineData("0", false)]
    public void IsResetOnStartupEnabled_ShouldFallbackToConfiguration_WhenEnvVarIsEmpty(string configValue, bool expected)
    {
        var originalEnv = Environment.GetEnvironmentVariable("RESET_DATABASE_ON_STARTUP");
        try
        {
            Environment.SetEnvironmentVariable("RESET_DATABASE_ON_STARTUP", null);

            var inMemoryConfig = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "Database:ResetOnStartup", configValue }
                })
                .Build();

            var result = DatabaseResetManager.IsResetOnStartupEnabled(inMemoryConfig);

            result.Should().Be(expected);
        }
        finally
        {
            Environment.SetEnvironmentVariable("RESET_DATABASE_ON_STARTUP", originalEnv);
        }
    }

    [Fact]
    public void IsResetOnStartupEnabled_ShouldDefaultToFalse_WhenNothingIsConfigured()
    {
        var originalEnv = Environment.GetEnvironmentVariable("RESET_DATABASE_ON_STARTUP");
        try
        {
            Environment.SetEnvironmentVariable("RESET_DATABASE_ON_STARTUP", null);

            var inMemoryConfig = new ConfigurationBuilder().Build();
            var result = DatabaseResetManager.IsResetOnStartupEnabled(inMemoryConfig);

            result.Should().BeFalse();
        }
        finally
        {
            Environment.SetEnvironmentVariable("RESET_DATABASE_ON_STARTUP", originalEnv);
        }
    }
}
