using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AIInterviewCoach.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpectedAnswerGuideToQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExpectedAnswerGuide",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpectedAnswerGuide",
                table: "Questions");
        }
    }
}
