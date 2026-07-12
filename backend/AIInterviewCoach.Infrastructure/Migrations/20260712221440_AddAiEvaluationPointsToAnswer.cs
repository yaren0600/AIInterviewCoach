using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AIInterviewCoach.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiEvaluationPointsToAnswer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImprovementPointsJson",
                table: "Answers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StrongPointsJson",
                table: "Answers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImprovementPointsJson",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "StrongPointsJson",
                table: "Answers");
        }
    }
}
