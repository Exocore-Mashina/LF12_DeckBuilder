using DeckbuilderBackend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// ---- CORS hinzuf�gen (Entwicklung: erlaubt alle Origins) ----
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Für Entwicklung: erlaubt alle Origins, Header und Methoden.
        // In Produktion bitte auf konkrete Origins einschränken.
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ---- DbContext konfigurieren ----
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))
);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// ---- CORS Middleware einbinden ----
app.UseCors("AllowFrontend");

app.MapControllers();

app.Run();
