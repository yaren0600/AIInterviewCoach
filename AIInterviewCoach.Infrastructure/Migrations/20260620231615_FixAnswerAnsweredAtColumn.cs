using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AIInterviewCoach.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAnswerAnsweredAtColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AnswerAt",
                table: "Answers",
                newName: "AnsweredAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AnsweredAt",
                table: "Answers",
                newName: "AnswerAt");
        }
    }
}
