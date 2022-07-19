<?php get_header();?>

<head>
	
	<style type="text/css">

.widget{

        list-style-type: none;
        margin: 0;
        padding: 0;


    }
    .widget li{

        color: black;
        font-family: 'Times New Roman', cursive;
        font-size: 20px;
        text-align: left;
        list-style-type: none;
        margin: 5px 0;
        margin-left: -30px;
        margin-top: 5px;


    }
    .widget li a{
color: #ffc678;
        margin: 0;
        padding: 0;
        transition: 2s;

    }
    .widget li a:hover{

        color: darkgrey;


    }
    .widget ul{

        margin-top: 30px;
    }

    .widget h6{

          font-family: 'Times New Roman', cursive;

        }
        .widget h3{

          font-family: 'Times New Roman', cursive;
        }





	 </style>
</head>





<section class="page-wrap">
<div class="container">
<section class="row">
<div class="col-lg-3">


	<?php if(is_active_sidebar('page0sidebar')):?>
	<?php dynamic_sidebar('page0sidebar');?>

<?php endif;?>

</div>





<div class="col-lg-9">



	<h1><?php the_title();?></h1>	

	<?php get_template_part('includes/section','content');?>



</div>
</section>
</div>
</section>
<?php get_footer(); ?>