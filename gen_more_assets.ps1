Add-Type -AssemblyName System.Drawing
$BG1=[System.Drawing.ColorTranslator]::FromHtml('#0B1929')
$BG2=[System.Drawing.ColorTranslator]::FromHtml('#0E2138')
$CARD=[System.Drawing.ColorTranslator]::FromHtml('#16304F')
$BORD=[System.Drawing.ColorTranslator]::FromHtml('#274869')
$GOLD=[System.Drawing.ColorTranslator]::FromHtml('#E9A020')
$GOLDBG=[System.Drawing.ColorTranslator]::FromHtml('#3A2E12')
$WHITE=[System.Drawing.ColorTranslator]::FromHtml('#F1F5F9')
$MUTED=[System.Drawing.ColorTranslator]::FromHtml('#94A8C0')
$GREEN=[System.Drawing.ColorTranslator]::FromHtml('#2ECC71')
$GREENBG=[System.Drawing.ColorTranslator]::FromHtml('#14352A')

function NewG($w,$h){
  $bmp=New-Object System.Drawing.Bitmap $w,$h
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode='AntiAlias'; $g.InterpolationMode='HighQualityBicubic'; $g.TextRenderingHint='ClearTypeGridFit'
  $r=New-Object System.Drawing.Rectangle 0,0,$w,$h
  $grad=New-Object System.Drawing.Drawing2D.LinearGradientBrush $r,$BG1,$BG2,90
  $g.FillRectangle($grad,$r)
  return @($bmp,$g)
}
function RR($g,$x,$y,$w,$h,$rad,$col){
  $p=New-Object System.Drawing.Drawing2D.GraphicsPath; $d=$rad*2
  $p.AddArc($x,$y,$d,$d,180,90); $p.AddArc($x+$w-$d,$y,$d,$d,270,90)
  $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90); $p.AddArc($x,$y+$h-$d,$d,$d,90,90); $p.CloseFigure()
  $b=New-Object System.Drawing.SolidBrush $col; $g.FillPath($b,$p); $b.Dispose(); return $p
}
function RRB($g,$x,$y,$w,$h,$rad,$col,$bcol,$bw){ $p=RR $g $x $y $w $h $rad $col; $pen=New-Object System.Drawing.Pen $bcol,$bw; $g.DrawPath($pen,$p); $pen.Dispose(); $p.Dispose() }
function F($s,$st='Regular'){ New-Object System.Drawing.Font 'Segoe UI',$s,([System.Drawing.FontStyle]::$st) }
function T($g,$t,$f,$c,$x,$y){ $b=New-Object System.Drawing.SolidBrush $c; $g.DrawString($t,$f,$b,[float]$x,[float]$y); $b.Dispose() }
function TW($g,$t,$f,$c,$x,$y,$w,$h){ $b=New-Object System.Drawing.SolidBrush $c; $rf=New-Object System.Drawing.RectangleF $x,$y,$w,$h; $g.DrawString($t,$f,$b,$rf); $b.Dispose() }
function Head($g,$k,$t){ T $g 'SuperRecall' (F 26 'Bold') $GOLD 60 70; T $g $k (F 22) $MUTED 60 112; T $g $t (F 46 'Bold') $WHITE 60 150 }
function Save($bmp,$n){ $bmp.Save((Join-Path (Get-Location) "resources\$n"),[System.Drawing.Imaging.ImageFormat]::Png) }
function Bar($g,$x,$y,$w,$pct,$col){ RR $g $x $y $w 32 16 $CARD | Out-Null; RR $g $x $y ([int]($w*$pct/100)) 32 16 $col | Out-Null }

# Phone 5: Home / Today
$a=NewG 1080 1920; $bmp=$a[0]; $g=$a[1]
Head $g 'Tuesday evening' 'Good evening'
RRB $g 60 250 960 300 24 $CARD $BORD 2
T $g "TODAY'S PLAN" (F 20 'Bold') $GOLD 95 285
T $g 'Continue: Basel III Framework' (F 30 'Bold') $WHITE 95 330
T $g 'BFM - Module B - 3 cards left today' (F 24) $MUTED 95 380
RR $g 95 440 500 80 18 $GOLD | Out-Null
T $g 'Resume study ->' (F 28 'Bold') $BG1 130 462
RRB $g 60 590 960 150 24 $GREENBG $GREEN 2
T $g 'Study streak: 14 days' (F 30 'Bold') $WHITE 95 625
T $g 'Best run yet - keep it going!' (F 24) $MUTED 95 675
$acts=@(@('Practice','#60A5FA'),@('Microlessons','#2DD4BF'),@('Mock Test','#FB923C'),@('AI Coach','#E9A020'))
for($i=0;$i -lt 4;$i++){
  $col=[System.Drawing.ColorTranslator]::FromHtml($acts[$i][1])
  $x=60+($i%2)*490; $y=790+[int]($i/2)*180
  RRB $g $x $y 470 150 22 $CARD $BORD 2
  RR $g ($x+30) ($y+45) 60 60 14 $col | Out-Null
  T $g $acts[$i][0] (F 30 'Bold') $WHITE ($x+115) ($y+52)
}
RRB $g 60 1170 960 150 24 $CARD $BORD 2
T $g 'Energy mode' (F 24 'Bold') $MUTED 95 1205
T $g 'Low - light revision after work' (F 28 'Bold') $WHITE 95 1250
Save $bmp 'screenshot-5.png'; $g.Dispose(); $bmp.Dispose()

# Phone 6: RBI Circular Tracker
$a=NewG 1080 1920; $bmp=$a[0]; $g=$a[1]
Head $g 'Stay current' 'RBI Circular Tracker'
$circs=@(
 @('Basel III - Countercyclical Capital Buffer','CCyB retained at 0%; banks to keep monitoring credit-to-GDP gap.','BFM - Risk','#60A5FA'),
 @('Priority Sector Lending - Revised Targets','Updated sub-targets for small & marginal farmers and micro enterprises.','ABM - Credit','#2DD4BF'),
 @('Digital Lending Guidelines','Loan disbursal and repayment to flow only through regulated entities.','IT - Digital','#FB923C'),
 @('KYC Master Direction - Amendment','Periodic updation timelines and CDD norms clarified.','BRBL - Compliance','#A78BFA'))
$y=260
foreach($c in $circs){
  $col=[System.Drawing.ColorTranslator]::FromHtml($c[3])
  RRB $g 60 $y 960 350 24 $CARD $BORD 2
  T $g 'AI SUMMARY' (F 18 'Bold') $GOLD 95 ($y+25)
  TW $g $c[0] (F 28 'Bold') $WHITE 95 ($y+60) 890 80
  TW $g $c[1] (F 23) $MUTED 95 ($y+150) 890 110
  RR $g 95 ($y+265) 320 56 14 $GOLDBG | Out-Null
  T $g $c[2] (F 22 'Bold') $col 120 ($y+278)
  $y+=390
}
Save $bmp 'screenshot-6.png'; $g.Dispose(); $bmp.Dispose()

# Phone 7: Subjects & Electives
$a=NewG 1080 1920; $bmp=$a[0]; $g=$a[1]
Head $g 'Full CAIIB coverage' 'Subjects & Electives'
T $g 'COMPULSORY PAPERS' (F 22 'Bold') $GOLD 60 250
$comp=@(@('ABM','Advanced Bank Management',78,'#2DD4BF','Free'),@('BFM','Bank Financial Management',65,'#60A5FA','Free'),@('ABFM','Adv. Business & Financial Mgmt',40,'#FB923C','Premium'),@('BRBL','Banking Regulations & Laws',55,'#A78BFA','Premium'))
$y=300
foreach($s in $comp){
  $col=[System.Drawing.ColorTranslator]::FromHtml($s[3])
  RRB $g 60 $y 960 150 22 $CARD $BORD 2
  T $g $s[0] (F 32 'Bold') $col 95 ($y+28)
  T $g $s[1] (F 24) $WHITE 95 ($y+80)
  if($s[4] -eq 'Free'){ RR $g 800 ($y+30) 170 50 12 $GREENBG | Out-Null; T $g 'Free' (F 22 'Bold') $GREEN 850 ($y+40) }
  else { RR $g 760 ($y+30) 210 50 12 $GOLDBG | Out-Null; T $g 'Premium' (F 22 'Bold') $GOLD 790 ($y+40) }
  $y+=170
}
T $g 'ELECTIVES  (choose one)' (F 22 'Bold') $GOLD 60 ($y+15)
$elec=@('Risk Management','Rural Banking','Central Banking','IT & Digital Banking','Human Resource Mgmt')
$y=$y+70
foreach($e in $elec){
  RRB $g 60 $y 960 95 18 $CARD $BORD 2
  T $g $e (F 28 'Bold') $WHITE 95 ($y+28)
  T $g '>' (F 30 'Bold') $MUTED 950 ($y+25)
  $y+=110
}
Save $bmp 'screenshot-7.png'; $g.Dispose(); $bmp.Dispose()

# ── Tablet screenshots (2560 x 1600 landscape) ──
# Tablet 1: Dashboard
$a=NewG 2560 1600; $bmp=$a[0]; $g=$a[1]
T $g 'SuperRecall' (F 40 'Bold') $GOLD 90 80
T $g 'Exam Readiness Dashboard' (F 64 'Bold') $WHITE 90 130
# left: subjects
RRB $g 90 280 1180 1180 28 $CARD $BORD 2
T $g 'YOUR PAPERS' (F 30 'Bold') $GOLD 140 320
$subs=@(@('ABM',78,'#2DD4BF'),@('BFM',65,'#60A5FA'),@('ABFM',70,'#FB923C'),@('BRBL',80,'#A78BFA'))
$y=420
foreach($s in $subs){ $col=[System.Drawing.ColorTranslator]::FromHtml($s[1+1]); T $g $s[0] (F 40 'Bold') $WHITE 140 ($y-6); Bar $g 380 ($y+4) 720 $s[1] $col; T $g ("{0}%" -f $s[1]) (F 36 'Bold') $WHITE 1140 ($y-10); $y+=190 }
# right: readiness + streak
RRB $g 1330 280 1140 560 28 $CARD $BORD 2
T $g '72%' (F 200 'Bold') $GOLD 1400 360
T $g 'Exam readiness - On track' (F 40 'Bold') $GREEN 1400 720
RRB $g 1330 900 1140 250 28 $GREENBG $GREEN 2
T $g 'Study streak: 14 days' (F 48 'Bold') $WHITE 1390 960
T $g 'Best paper: BRBL   -   Focus next: BFM' (F 32) $MUTED 1390 1040
RRB $g 1330 1210 1140 250 28 $CARD $BORD 2
T $g 'Daily goal' (F 36 'Bold') $MUTED 1390 1260
T $g '12 / 15 cards' (F 60 'Bold') $GOLD 1390 1320
Save $bmp 'tablet-1.png'; $g.Dispose(); $bmp.Dispose()

# Tablet 2: Study + Quiz split
$a=NewG 2560 1600; $bmp=$a[0]; $g=$a[1]
T $g 'SuperRecall' (F 40 'Bold') $GOLD 90 80
T $g 'Learn, then practice' (F 64 'Bold') $WHITE 90 130
RRB $g 90 280 1180 1180 28 $CARD $BORD 2
T $g 'MICROLESSON - Basel III' (F 30 'Bold') $GOLD 140 320
TW $g 'Basel III sets the minimum capital banks must hold to absorb unexpected losses, via Tier 1 and Tier 2 capital plus regulatory buffers.' (F 38) $WHITE 140 390 1080 220
RR $g 140 640 1080 100 18 $GOLDBG | Out-Null
T $g 'CET1 5.5% | Tier 1 7.0% | Total 9.0% | +CCB 11.5%' (F 32 'Bold') $GOLD 175 672
T $g 'Three Pillars: Capital - Supervision - Disclosure' (F 34 'Bold') $WHITE 140 820
TW $g 'Pillar 1 sets minimum capital for credit, market and operational risk. Pillar 2 is the supervisory review (ICAAP). Pillar 3 enforces market discipline through disclosure.' (F 32) $MUTED 140 890 1080 300
RRB $g 1330 280 1140 1180 28 $CARD $BORD 2
T $g 'PRACTICE' (F 30 'Bold') $GOLD 1390 320
TW $g 'Minimum CRAR for scheduled commercial banks in India (excluding buffers)?' (F 38 'Bold') $WHITE 1390 375 1020 220
$opts=@('8.0%','9.0%','10.5%','11.5%'); $correct=1
for($i=0;$i -lt 4;$i++){ $yy=620+$i*180; if($i -eq $correct){ RRB $g 1390 $yy 1020 140 18 $GREENBG $GREEN 3; $pen=New-Object System.Drawing.Pen $GREEN,9; $pen.StartCap='Round'; $pen.EndCap='Round'; $g.DrawLines($pen, @((New-Object System.Drawing.Point 1440,($yy+75)),(New-Object System.Drawing.Point 1470,($yy+105)),(New-Object System.Drawing.Point 1520,($yy+45)))); $pen.Dispose() } else { RRB $g 1390 $yy 1020 140 18 $CARD $BORD 2; T $g ([string][char](65+$i)) (F 36 'Bold') $GOLD 1440 ($yy+48) } ; T $g $opts[$i] (F 40) $WHITE 1560 ($yy+45) }
Save $bmp 'tablet-2.png'; $g.Dispose(); $bmp.Dispose()

'generated:'
Get-ChildItem resources\screenshot-5.png,resources\screenshot-6.png,resources\screenshot-7.png,resources\tablet-1.png,resources\tablet-2.png | ForEach-Object { $im=[System.Drawing.Image]::FromFile($_.FullName); ('{0} {1}x{2} {3}KB' -f $_.Name,$im.Width,$im.Height,[math]::Round($_.Length/1KB,1)); $im.Dispose() }
